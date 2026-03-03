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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) throw new Error(`Authentication error: ${authError.message}`);

    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

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

    // Verify the session belongs to this user
    const sessionEmail = session.customer_details?.email || session.customer_email;
    if (sessionEmail?.toLowerCase() !== user.email.toLowerCase()) {
      return new Response(
        JSON.stringify({ verified: false, error: "Session does not belong to this user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const paid = session.payment_status === "paid";

    // If paid and paystub_id is in metadata, mark paystub as completed
    if (paid && session.metadata?.paystub_id) {
      const paystubId = session.metadata.paystub_id;
      await supabaseAdmin
        .from("paystubs")
        .update({ status: "completed", is_watermarked: false })
        .eq("id", paystubId)
        .eq("user_id", user.id);

      // Record transaction
      await supabaseAdmin.from("transactions").insert({
        user_id: user.id,
        paystub_id: paystubId,
        amount: (session.amount_total || 499) / 100,
        currency: session.currency || "usd",
        status: "succeeded",
        stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
        description: "Pay-per-use paystub purchase",
      });
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
      JSON.stringify({ verified: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
