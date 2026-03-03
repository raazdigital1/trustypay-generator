import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYSTUB_PRICE_ID = "price_1T6ofHGf3K1hj4vv0fSVSqWO";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Service role client for coupon operations (bypasses RLS)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) throw new Error(`Authentication error: ${authError.message}`);

    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Validate email format server-side
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email) || user.email.length > 255) {
      throw new Error("Invalid email address");
    }

    const body = await req.json().catch(() => ({}));
    const couponCode = typeof body.coupon_code === "string" ? body.coupon_code.trim().toUpperCase() : null;

    // Validate coupon if provided
    let discountPercent: number | null = null;
    let discountAmountCents: number | null = null;
    let couponId: string | null = null;

    if (couponCode) {
      const { data: coupon, error: couponErr } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", couponCode)
        .eq("is_active", true)
        .single();

      if (couponErr || !coupon) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired coupon code" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Check expiration
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "This coupon has expired" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Check max uses
      if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        return new Response(
          JSON.stringify({ error: "This coupon has reached its usage limit" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      couponId = coupon.id;

      if (coupon.discount_type === "percentage") {
        discountPercent = coupon.discount_value;
      } else {
        // Fixed amount in dollars → cents
        discountAmountCents = Math.round(coupon.discount_value * 100);
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Build Stripe coupon if discount applies
    let stripeCouponId: string | undefined;
    if (discountPercent !== null || discountAmountCents !== null) {
      const couponParams: Stripe.CouponCreateParams = {
        duration: "once",
        ...(discountPercent !== null
          ? { percent_off: discountPercent }
          : { amount_off: discountAmountCents!, currency: "usd" }),
      };
      const stripeCoupon = await stripe.coupons.create(couponParams);
      stripeCouponId = stripeCoupon.id;
    }

    // Create one-time payment session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: PAYSTUB_PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/create?payment=success`,
      cancel_url: `${req.headers.get("origin")}/create?payment=canceled`,
      metadata: couponId ? { coupon_id: couponId } : undefined,
    };

    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Increment coupon usage
    if (couponId) {
      await supabaseAdmin.rpc("increment_coupon_usage" as never, { coupon_uuid: couponId } as never).catch(() => {
        // Non-critical: log but don't fail the checkout
        console.error("Failed to increment coupon usage");
      });

      // Fallback: direct update if RPC doesn't exist yet
      await supabaseAdmin
        .from("coupons")
        .update({ current_uses: (await supabaseAdmin.from("coupons").select("current_uses").eq("id", couponId).single()).data?.current_uses + 1 })
        .eq("id", couponId)
        .catch(() => {});
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
