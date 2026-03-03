import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : null;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing session_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";

    // Get the user_id from metadata (set during create-payment)
    const userId = session.metadata?.user_id;
    const sessionEmail = session.customer_details?.email || session.customer_email;

    // Verify via auth header if present, otherwise use metadata
    const authHeader = req.headers.get("Authorization");
    let verifiedUserId: string | null = null;

    if (authHeader && authHeader !== "Bearer null" && authHeader !== "Bearer undefined") {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const token = authHeader.replace("Bearer ", "");
      const { data, error: authError } = await supabaseClient.auth.getUser(token);
      if (!authError && data.user) {
        // Authenticated user - verify email matches
        if (sessionEmail?.toLowerCase() !== data.user.email?.toLowerCase()) {
          return new Response(
            JSON.stringify({ verified: false, error: "Session does not belong to this user" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
        verifiedUserId = data.user.id;
      }
    }

    // Fall back to metadata user_id if not authenticated
    if (!verifiedUserId && userId) {
      // Verify the metadata user_id matches the session email
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userData?.user?.email?.toLowerCase() === sessionEmail?.toLowerCase()) {
        verifiedUserId = userId;
      }
    }

    if (!verifiedUserId) {
      return new Response(
        JSON.stringify({ verified: false, error: "Could not verify payment ownership" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // If paid and paystub_id is in metadata, mark paystub as completed
    if (paid && session.metadata?.paystub_id) {
      const paystubId = session.metadata.paystub_id;
      await supabaseAdmin
        .from("paystubs")
        .update({ status: "completed", is_watermarked: false })
        .eq("id", paystubId)
        .eq("user_id", verifiedUserId);

      // Record transaction
      await supabaseAdmin.from("transactions").insert({
        user_id: verifiedUserId,
        paystub_id: paystubId,
        amount: (session.amount_total || 499) / 100,
        currency: session.currency || "usd",
        status: "succeeded",
        stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
        description: "Pay-per-use paystub purchase",
      });
    }

    // Send password reset email for new users so they can set their password
    if (paid && sessionEmail) {
      const origin = req.headers.get("origin") || "https://trustypay-generator.lovable.app";
      try {
        // Only send if user hasn't logged in before (no last_sign_in_at or very recent creation)
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(verifiedUserId);
        if (userData?.user && !userData.user.last_sign_in_at) {
          await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: sessionEmail,
            options: {
              redirectTo: `${origin}/dashboard`,
            },
          });
        }
      } catch (emailErr) {
        console.error("Failed to send setup email:", emailErr);
        // Don't fail the payment verification if email fails
      }
    }

    return new Response(
      JSON.stringify({
        verified: paid,
        status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        paystub_id: session.metadata?.paystub_id || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Verify payment error:", error);
    return new Response(
      JSON.stringify({ verified: false, error: "An error occurred while verifying payment" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
