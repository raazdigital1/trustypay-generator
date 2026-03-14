import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYSTUB_PRICE_ID = "price_1T6ofHGf3K1hj4vv0fSVSqWO";

function calculateTotals(data: any) {
  const grossPay = data.earnings.isHourly
    ? data.earnings.regularHours * data.earnings.hourlyRate +
      data.earnings.overtimeHours * data.earnings.overtimeRate +
      data.earnings.bonus + data.earnings.commission + data.earnings.tips + data.earnings.otherEarnings
    : data.earnings.salaryAmount +
      data.earnings.bonus + data.earnings.commission + data.earnings.tips + data.earnings.otherEarnings;

  const totalDeductions =
    data.deductions.federalTax + data.deductions.stateTax +
    data.deductions.socialSecurity + data.deductions.medicare +
    data.deductions.retirement401k + data.deductions.healthInsurance +
    data.deductions.otherDeductions;

  return { grossPay, totalDeductions, netPay: grossPay - totalDeductions };
}

async function savePaystubServerSide(supabaseAdmin: any, userId: string, data: any): Promise<string> {
  const { grossPay, totalDeductions, netPay } = calculateTotals(data);

  const { data: employer, error: empErr } = await supabaseAdmin
    .from("employers")
    .insert({
      user_id: userId,
      company_name: data.employer.companyName || "Unknown",
      address_line1: data.employer.addressLine1,
      address_line2: data.employer.addressLine2,
      city: data.employer.city,
      state: data.employer.state,
      zip_code: data.employer.zipCode,
      ein: data.employer.ein,
      phone: data.employer.phone,
      email: data.employer.email,
    })
    .select("id")
    .single();
  if (empErr) throw empErr;

  const { data: employee, error: eeErr } = await supabaseAdmin
    .from("employees")
    .insert({
      user_id: userId,
      employer_id: employer.id,
      first_name: data.employee.firstName || "Unknown",
      last_name: data.employee.lastName || "Unknown",
      address_line1: data.employee.addressLine1,
      address_line2: data.employee.addressLine2,
      city: data.employee.city,
      state: data.employee.state,
      zip_code: data.employee.zipCode,
      ssn_last_four: data.employee.ssnLastFour,
      employee_id: data.employee.employeeId,
    })
    .select("id")
    .single();
  if (eeErr) throw eeErr;

  const { data: paystub, error: psErr } = await supabaseAdmin
    .from("paystubs")
    .insert({
      user_id: userId,
      employer_id: employer.id,
      employee_id: employee.id,
      template_id: data.templateId,
      pay_frequency: data.payPeriod.frequency,
      pay_period_start: data.payPeriod.periodStart,
      pay_period_end: data.payPeriod.periodEnd,
      pay_date: data.payPeriod.payDate,
      is_hourly: data.earnings.isHourly,
      regular_hours: data.earnings.regularHours,
      hourly_rate: data.earnings.hourlyRate,
      salary_amount: data.earnings.salaryAmount,
      overtime_hours: data.earnings.overtimeHours,
      overtime_rate: data.earnings.overtimeRate,
      bonus: data.earnings.bonus,
      commission: data.earnings.commission,
      tips: data.earnings.tips,
      other_earnings: data.earnings.otherEarnings,
      federal_tax: data.deductions.federalTax,
      state_tax: data.deductions.stateTax,
      social_security: data.deductions.socialSecurity,
      medicare: data.deductions.medicare,
      retirement_401k: data.deductions.retirement401k,
      health_insurance: data.deductions.healthInsurance,
      other_deductions: data.deductions.otherDeductions,
      gross_pay: grossPay,
      total_deductions: totalDeductions,
      net_pay: netPay,
      state_code: data.stateCode,
      status: "draft",
      is_watermarked: true,
      ytd_gross: data.ytd?.grossPay || 0,
      ytd_federal_tax: data.ytd?.federalTax || 0,
      ytd_state_tax: data.ytd?.stateTax || 0,
      ytd_social_security: data.ytd?.socialSecurity || 0,
      ytd_medicare: data.ytd?.medicare || 0,
      ytd_net: data.ytd?.netPay || 0,
    })
    .select("id")
    .single();
  if (psErr) throw psErr;

  return paystub.id;
}

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
    const body = await req.json().catch(() => ({}));
    const couponCode = typeof body.coupon_code === "string" ? body.coupon_code.trim().toUpperCase() : null;
    const paystubData = body.paystub_data || null;
    const quantity = Math.min(Math.max(parseInt(body.quantity) || 1, 1), 10);
    const guestEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;

    let userEmail: string;
    let userId: string;
    let paystubId: string | null = typeof body.paystub_id === "string" ? body.paystub_id : null;

    // Check if authenticated user
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader !== "Bearer null" && authHeader !== "Bearer undefined") {
      const token = authHeader.replace("Bearer ", "");
      const { data, error: authError } = await supabaseClient.auth.getUser(token);
      if (!authError && data.user?.email) {
        userEmail = data.user.email;
        userId = data.user.id;

        // If authenticated user provided paystub_data, save it
        if (paystubData && !paystubId) {
          paystubId = await savePaystubServerSide(supabaseAdmin, userId, paystubData);
        }
      } else {
        // Auth failed, fall through to guest flow
        if (!guestEmail) {
          return new Response(
            JSON.stringify({ error: "Email address is required" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
        const result = await handleGuestUser(supabaseAdmin, guestEmail, paystubData, req);
        userEmail = result.email;
        userId = result.userId;
        paystubId = result.paystubId;
      }
    } else {
      // Guest checkout flow
      if (!guestEmail) {
        return new Response(
          JSON.stringify({ error: "Email address is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      const result = await handleGuestUser(supabaseAdmin, guestEmail, paystubData, req);
      userEmail = result.email;
      userId = result.userId;
      paystubId = result.paystubId;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail) || userEmail.length > 255) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

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
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "This coupon has expired" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        return new Response(
          JSON.stringify({ error: "This coupon has reached its usage limit" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      couponId = coupon.id;

      if (coupon.discount_type === "percentage") {
        discountPercent = coupon.discount_value;
      } else {
        discountAmountCents = Math.round(coupon.discount_value * 100);
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Build Stripe coupon if discount applies
    let stripeCouponId: string | undefined;
    if (discountPercent !== null || discountAmountCents !== null) {
      try {
        const couponParams: Stripe.CouponCreateParams = {
          duration: "once",
          ...(discountPercent !== null
            ? { percent_off: discountPercent }
            : { amount_off: discountAmountCents!, currency: "usd" }),
        };
        const stripeCoupon = await stripe.coupons.create(couponParams);
        stripeCouponId = stripeCoupon.id;
      } catch (stripeErr) {
        console.error("Stripe coupon creation failed:", stripeErr);
        return new Response(
          JSON.stringify({ error: "Failed to apply discount. Please try again without coupon." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const successUrl = paystubId
      ? `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&paystub_id=${paystubId}`
      : `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [{ price: PAYSTUB_PRICE_ID, quantity }],
      mode: "payment",
      success_url: successUrl,
      cancel_url: `${origin}/create?payment=canceled`,
      metadata: {
        user_id: userId,
        ...(couponId ? { coupon_id: couponId } : {}),
        ...(paystubId ? { paystub_id: paystubId } : {}),
      },
    };

    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Increment coupon usage (non-blocking)
    if (couponId) {
      supabaseAdmin
        .from("coupons")
        .select("current_uses")
        .eq("id", couponId)
        .single()
        .then(({ data: couponData }) => {
          if (couponData) {
            supabaseAdmin
              .from("coupons")
              .update({ current_uses: (couponData.current_uses || 0) + 1 })
              .eq("id", couponId)
              .then(() => console.log("Coupon usage incremented"))
              .catch((e: any) => console.error("Coupon increment failed:", e));
          }
        })
        .catch((e: any) => console.error("Coupon fetch for increment failed:", e));
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment function error:", error);
    return new Response(JSON.stringify({ error: "An error occurred while processing payment" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

async function handleGuestUser(
  supabaseAdmin: any,
  email: string,
  paystubData: any,
  req: Request
): Promise<{ email: string; userId: string; paystubId: string | null }> {
  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u: any) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    // Create a new user with a random password (they'll get a reset email after payment)
    const randomPassword = crypto.randomUUID() + "Aa1!";
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { full_name: "" },
    });
    if (createErr) throw new Error("Failed to create account");
    userId = newUser.user.id;
  }

  // Save paystub data server-side
  let paystubId: string | null = null;
  if (paystubData) {
    paystubId = await savePaystubServerSide(supabaseAdmin, userId, paystubData);
  }

  return { email, userId, paystubId };
}
