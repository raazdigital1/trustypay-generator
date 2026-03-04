import { supabase } from "@/integrations/supabase/client";
import { PaystubData } from "@/types/paystub";

function calculateTotals(data: PaystubData) {
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

export async function savePaystubToDb(data: PaystubData, userId: string): Promise<string> {
  const { grossPay, totalDeductions, netPay } = calculateTotals(data);

  const { data: employer, error: empErr } = await supabase
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

  const { data: employee, error: eeErr } = await supabase
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

  const { data: paystub, error: psErr } = await supabase
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
      ytd_gross: data.ytd.grossPay,
      ytd_federal_tax: data.ytd.federalTax,
      ytd_state_tax: data.ytd.stateTax,
      ytd_social_security: data.ytd.socialSecurity,
      ytd_medicare: data.ytd.medicare,
      ytd_net: data.ytd.netPay,
    })
    .select("id")
    .single();
  if (psErr) throw psErr;

  return paystub.id;
}

export async function loadPaystubFromDb(paystubId: string): Promise<PaystubData | null> {
  const { data: ps, error } = await supabase
    .from("paystubs")
    .select("*")
    .eq("id", paystubId)
    .single();
  if (error || !ps) return null;

  let employer: any = null;
  let employee: any = null;

  if (ps.employer_id) {
    const { data } = await supabase.from("employers").select("*").eq("id", ps.employer_id).single();
    employer = data;
  }
  if (ps.employee_id) {
    const { data } = await supabase.from("employees").select("*").eq("id", ps.employee_id).single();
    employee = data;
  }

  return {
    templateId: ps.template_id || "classic",
    employer: {
      companyName: employer?.company_name || "",
      addressLine1: employer?.address_line1 || "",
      addressLine2: employer?.address_line2 || "",
      city: employer?.city || "",
      state: employer?.state || "",
      zipCode: employer?.zip_code || "",
      ein: employer?.ein || "",
      phone: employer?.phone || "",
      email: employer?.email || "",
    },
    employee: {
      firstName: employee?.first_name || "",
      lastName: employee?.last_name || "",
      addressLine1: employee?.address_line1 || "",
      addressLine2: employee?.address_line2 || "",
      city: employee?.city || "",
      state: employee?.state || "",
      zipCode: employee?.zip_code || "",
      ssnLastFour: employee?.ssn_last_four || "",
      employeeId: employee?.employee_id || "",
    },
    earnings: {
      isHourly: ps.is_hourly ?? true,
      regularHours: Number(ps.regular_hours) || 0,
      hourlyRate: Number(ps.hourly_rate) || 0,
      salaryAmount: Number(ps.salary_amount) || 0,
      overtimeHours: Number(ps.overtime_hours) || 0,
      overtimeRate: Number(ps.overtime_rate) || 0,
      bonus: Number(ps.bonus) || 0,
      commission: Number(ps.commission) || 0,
      tips: Number(ps.tips) || 0,
      otherEarnings: Number(ps.other_earnings) || 0,
    },
    deductions: {
      federalTax: Number(ps.federal_tax) || 0,
      stateTax: Number(ps.state_tax) || 0,
      socialSecurity: Number(ps.social_security) || 0,
      medicare: Number(ps.medicare) || 0,
      retirement401k: Number(ps.retirement_401k) || 0,
      healthInsurance: Number(ps.health_insurance) || 0,
      otherDeductions: Number(ps.other_deductions) || 0,
    },
    payPeriod: {
      frequency: (ps.pay_frequency as any) || "bi_weekly",
      periodStart: ps.pay_period_start,
      periodEnd: ps.pay_period_end,
      payDate: ps.pay_date,
      numberOfStubs: 1,
      payDates: [ps.pay_date],
    },
    ytd: {
      grossPay: Number(ps.ytd_gross) || 0,
      federalTax: Number(ps.ytd_federal_tax) || 0,
      stateTax: Number(ps.ytd_state_tax) || 0,
      socialSecurity: Number(ps.ytd_social_security) || 0,
      medicare: Number(ps.ytd_medicare) || 0,
      netPay: Number(ps.ytd_net) || 0,
    },
    stateCode: ps.state_code || "CA",
    includeYTD: true,
  };
}

export async function updatePaystubInDb(paystubId: string, data: PaystubData): Promise<void> {
  const { grossPay, totalDeductions, netPay } = calculateTotals(data);

  const { data: existing } = await supabase
    .from("paystubs")
    .select("employer_id, employee_id")
    .eq("id", paystubId)
    .single();
  if (!existing) throw new Error("Paystub not found");

  if (existing.employer_id) {
    await supabase.from("employers").update({
      company_name: data.employer.companyName,
      address_line1: data.employer.addressLine1,
      address_line2: data.employer.addressLine2,
      city: data.employer.city,
      state: data.employer.state,
      zip_code: data.employer.zipCode,
      ein: data.employer.ein,
      phone: data.employer.phone,
      email: data.employer.email,
    }).eq("id", existing.employer_id);
  }

  if (existing.employee_id) {
    await supabase.from("employees").update({
      first_name: data.employee.firstName,
      last_name: data.employee.lastName,
      address_line1: data.employee.addressLine1,
      address_line2: data.employee.addressLine2,
      city: data.employee.city,
      state: data.employee.state,
      zip_code: data.employee.zipCode,
      ssn_last_four: data.employee.ssnLastFour,
      employee_id: data.employee.employeeId,
    }).eq("id", existing.employee_id);
  }

  await supabase.from("paystubs").update({
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
    ytd_gross: data.ytd.grossPay,
    ytd_federal_tax: data.ytd.federalTax,
    ytd_state_tax: data.ytd.stateTax,
    ytd_social_security: data.ytd.socialSecurity,
    ytd_medicare: data.ytd.medicare,
    ytd_net: data.ytd.netPay,
  }).eq("id", paystubId);
}
