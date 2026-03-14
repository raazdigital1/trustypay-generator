import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYSTUB_PRICE_ID = "price_1T6ofHGf3K1hj4vv0fSVSqWO";

function calcGross(stub: any, isHourly: boolean) {
  const reg = isHourly ? stub.regularHours * stub.hourlyRate : stub.salaryAmount;
  const ot = (stub.overtimeHours || 0) * (stub.overtimeRate || 0);
  return reg + ot + (stub.bonus || 0) + (stub.commission || 0) + (stub.tips || 0) + (stub.otherEarnings || 0);
}

function calcDeductions(stub: any) {
  return (stub.federalTax || 0) + (stub.stateTax || 0) + (stub.socialSecurity || 0) +
    (stub.medicare || 0) + (stub.retirement401k || 0) + (stub.healthInsurance || 0) + (stub.otherDeductions || 0);
}

async function saveAllStubs(supabaseAdmin: any, userId: string, data: any): Promise<string[]> {
  // Save employer once
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

  // Save employee once
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

  const stubs = data.stubs && data.stubs.length > 0 ? data.stubs : [null];
  const isHourly = data.earnings?.isHourly ?? true;
  const paystubIds: string[] = [];

  for (const stub of stubs) {
    // Use per-stub data if available, otherwise fall back to base data
    const earnings = stub ? {
      regularHours: stub.regularHours,
      hourlyRate: stub.hourlyRate,
      salaryAmount: stub.salaryAmount,
      overtimeHours: stub.overtimeHours,
      overtimeRate: stub.overtimeRate,
      bonus: stub.bonus,
      commission: stub.commission,
      tips: stub.tips,
      otherEarnings: stub.otherEarnings,
    } : data.earnings;

    const deductions = stub ? {
      federalTax: stub.federalTax,
      stateTax: stub.stateTax,
      socialSecurity: stub.socialSecurity,
      medicare: stub.medicare,
      retirement401k: stub.retirement401k,
      healthInsurance: stub.healthInsurance,
      otherDeductions: stub.otherDeductions,
    } : data.deductions;

    const periodStart = stub?.periodStart || data.payPeriod.periodStart;
    const periodEnd = stub?.periodEnd || data.payPeriod.periodEnd;
    const payDate = stub?.payDate || data.payPeriod.payDate;

    const grossPay = stub ? calcGross(stub, isHourly) : calcGross(earnings, isHourly);
    const totalDeductions = stub ? calcDeductions(stub) : calcDeductions(deductions);
    const netPay = grossPay - totalDeductions;

    const ytdGross = stub?.ytdGrossPay || data.ytd?.grossPay || 0;
    const ytdFederal = stub?.ytdFederalTax || data.ytd?.federalTax || 0;
    const ytdState = stub?.ytdStateTax || data.ytd?.stateTax || 0;
    const ytdSS = stub?.ytdSocialSecurity || data.ytd?.socialSecurity || 0;
    const ytdMed = stub?.ytdMedicare || data.ytd?.medicare || 0;
    const ytdNet = stub?.ytdNetPay || data.ytd?.netPay || 0;

    const { data: paystub, error: psErr } = await supabaseAdmin
      .from("paystubs")
      .insert({
        user_id: userId,
        employer_id: employer.id,
        employee_id: employee.id,
        template_id: data.templateId,
        pay_frequency: data.payPeriod.frequency,
        pay_period_start: periodStart,
        pay_period_end: periodEnd,
        pay_date: payDate,
        is_hourly: isHourly,
        regular_hours: earnings.regularHours,
        hourly_rate: earnings.hourlyRate,
        salary_amount: earnings.salaryAmount,
        overtime_hours: earnings.overtimeHours,
        overtime_rate: earnings.overtimeRate,
        bonus: earnings.bonus,
        commission: earnings.commission,
        tips: earnings.tips,
        other_earnings: earnings.otherEarnings,
        federal_tax: deductions.federalTax,
        state_tax: deductions.stateTax,
        social_security: deductions.socialSecurity,
        medicare: deductions.medicare,
        retirement_401k: deductions.retirement401k,
        health_insurance: deductions.healthInsurance,
        other_deductions: deductions.otherDeductions,
        gross_pay: grossPay,
        total_deductions: totalDeductions,
        net_pay: netPay,
        state_code: data.stateCode,
        status: "draft",
        is_watermarked: true,
        ytd_gross: ytdGross,
        ytd_federal_tax: ytdFederal,
        ytd_state_tax: ytdState,
        ytd_social_security: ytdSS,
        ytd_medicare: ytdMed,
        ytd_net: ytdNet,
      })
      .select("id")
      .single();
    if (psErr) throw psErr;
    paystubIds.push(paystub.id);
  }

  return paystubIds;
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
    let paystubIds: string[] = [];

    // Check if authenticated user
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader !== "Bearer null" && authHeader !== "Bearer undefined") {
      const token = authHeader.replace("Bearer ", "");
      const { data, error: authError } = await supabaseClient.auth.getUser(token);
      if (!authError && data.user?.email) {
        userEmail = data.user.email;
        userId = data.user.id;

        if (paystubData) {
          paystubIds = await saveAllStubs(supabaseAdmin, userId, paystubData);
        }
      } else {
        if (!guestEmail) {
          return new Response(
            JSON.stringify({ error: "Email address is required" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
        const result = await handleGuestUser(supabaseAdmin, guestEmail, paystubData, req);
        userEmail = result.email;
        userId = result.userId;
        paystubIds = result.paystubIds;
      }
    } else {
      if (!guestEmail) {
        return new Response(
          JSON.stringify({ error: "Email address is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      const result = await handleGuestUser(supabaseAdmin, guestEmail, paystubData, req);
      userEmail = result.email;
      userId = result.userId;
      paystubIds = result.paystubIds;
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
    // Pass all paystub IDs as comma-separated in the URL
    const idsParam = paystubIds.length > 0 ? paystubIds.join(",") : "";
    const successUrl = idsParam
      ? `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&paystub_ids=${idsParam}`
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
        // Store paystub IDs in metadata (Stripe allows 500 chars per value)
        ...(idsParam ? { paystub_ids: idsParam } : {}),
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
        .then(({ data: couponData }: any) => {
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
): Promise<{ email: string; userId: string; paystubIds: string[] }> {
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u: any) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
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

  let paystubIds: string[] = [];
  if (paystubData) {
    paystubIds = await saveAllStubs(supabaseAdmin, userId, paystubData);
  }

  return { email, userId, paystubIds };
}
