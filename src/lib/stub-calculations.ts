import { PaystubData, IndividualStubData } from "@/types/paystub";
import { TaxRate } from "@/hooks/useTaxRates";

export function calculateGrossPay(stub: IndividualStubData, isHourly: boolean): number {
  const regularPay = isHourly
    ? stub.regularHours * stub.hourlyRate
    : stub.salaryAmount;
  const overtimePay = stub.overtimeHours * stub.overtimeRate;
  return regularPay + overtimePay + stub.bonus + stub.commission + stub.tips + stub.otherEarnings;
}

export function calculateTotalDeductions(stub: IndividualStubData): number {
  return (
    stub.federalTax + stub.stateTax + stub.socialSecurity +
    stub.medicare + stub.retirement401k + stub.healthInsurance + stub.otherDeductions
  );
}

export function recalculateStubTaxes(
  stub: IndividualStubData,
  isHourly: boolean,
  taxRate: TaxRate | null
): IndividualStubData {
  if (!taxRate) return stub;
  const grossPay = calculateGrossPay(stub, isHourly);
  return {
    ...stub,
    federalTax: Math.round(grossPay * taxRate.federal_rate * 100) / 100,
    stateTax: taxRate.has_state_tax
      ? Math.round(grossPay * taxRate.state_rate * 100) / 100
      : 0,
    socialSecurity: Math.round(grossPay * taxRate.social_security_rate * 100) / 100,
    medicare: Math.round(grossPay * taxRate.medicare_rate * 100) / 100,
  };
}

export function recalculateAllStubs(
  stubs: IndividualStubData[],
  isHourly: boolean,
  includeYTD: boolean,
  taxRate: TaxRate | null
): IndividualStubData[] {
  let ytdGross = 0;
  let ytdFederal = 0;
  let ytdState = 0;
  let ytdSS = 0;
  let ytdMed = 0;
  let ytdNet = 0;

  return stubs.map((stub) => {
    const recalced = recalculateStubTaxes(stub, isHourly, taxRate);
    const grossPay = calculateGrossPay(recalced, isHourly);
    const totalDed = calculateTotalDeductions(recalced);
    const netPay = grossPay - totalDed;

    if (includeYTD) {
      ytdGross += grossPay;
      ytdFederal += recalced.federalTax;
      ytdState += recalced.stateTax;
      ytdSS += recalced.socialSecurity;
      ytdMed += recalced.medicare;
      ytdNet += netPay;
    }

    return {
      ...recalced,
      ytdGrossPay: includeYTD ? ytdGross : grossPay,
      ytdFederalTax: includeYTD ? ytdFederal : recalced.federalTax,
      ytdStateTax: includeYTD ? ytdState : recalced.stateTax,
      ytdSocialSecurity: includeYTD ? ytdSS : recalced.socialSecurity,
      ytdMedicare: includeYTD ? ytdMed : recalced.medicare,
      ytdNetPay: includeYTD ? ytdNet : netPay,
    };
  });
}

export function initializeStubs(
  data: PaystubData,
  taxRate: TaxRate | null
): IndividualStubData[] {
  const count = data.payPeriod.numberOfStubs || 1;
  const payDates = data.payPeriod.payDates.slice(0, count);
  if (payDates.length === 0) payDates.push(data.payPeriod.payDate);

  const stubs: IndividualStubData[] = payDates.map((payDate, idx) => {
    const offset = payDates.length - 1 - idx;
    let periodStart: string;
    let periodEnd: string;

    if (offset === 0) {
      periodStart = data.payPeriod.periodStart;
      periodEnd = data.payPeriod.periodEnd;
    } else {
      const freq = data.payPeriod.frequency;
      const s = new Date(data.payPeriod.periodStart + "T12:00:00");
      const e = new Date(data.payPeriod.periodEnd + "T12:00:00");

      if (freq === "monthly") {
        s.setMonth(s.getMonth() - offset);
        e.setMonth(e.getMonth() - offset);
      } else if (freq === "semi_monthly") {
        s.setMonth(s.getMonth() - Math.floor(offset / 2));
        e.setMonth(e.getMonth() - Math.floor(offset / 2));
        if (offset % 2 === 1) {
          s.setDate(s.getDate() - 15);
          e.setDate(e.getDate() - 15);
        }
      } else {
        const days = freq === "weekly" ? 7 : 14;
        s.setDate(s.getDate() - offset * days);
        e.setDate(e.getDate() - offset * days);
      }
      periodStart = s.toISOString().split("T")[0];
      periodEnd = e.toISOString().split("T")[0];
    }

    return {
      periodStart,
      periodEnd,
      payDate,
      regularHours: data.earnings.regularHours,
      overtimeHours: data.earnings.overtimeHours,
      hourlyRate: data.earnings.hourlyRate,
      overtimeRate: data.earnings.overtimeRate,
      salaryAmount: data.earnings.salaryAmount,
      bonus: data.earnings.bonus,
      commission: data.earnings.commission,
      tips: data.earnings.tips,
      otherEarnings: data.earnings.otherEarnings,
      federalTax: data.deductions.federalTax,
      stateTax: data.deductions.stateTax,
      socialSecurity: data.deductions.socialSecurity,
      medicare: data.deductions.medicare,
      retirement401k: data.deductions.retirement401k,
      healthInsurance: data.deductions.healthInsurance,
      otherDeductions: data.deductions.otherDeductions,
      ytdGrossPay: 0,
      ytdFederalTax: 0,
      ytdStateTax: 0,
      ytdSocialSecurity: 0,
      ytdMedicare: 0,
      ytdNetPay: 0,
    };
  });

  return recalculateAllStubs(stubs, data.earnings.isHourly, data.includeYTD, taxRate);
}
