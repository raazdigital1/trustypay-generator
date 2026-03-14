export interface EmployerInfo {
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  ein: string;
  phone: string;
  email: string;
}

export interface EmployeeInfo {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  ssnLastFour: string;
  employeeId: string;
}

export interface EarningsInfo {
  isHourly: boolean;
  regularHours: number;
  hourlyRate: number;
  salaryAmount: number;
  overtimeHours: number;
  overtimeRate: number;
  bonus: number;
  commission: number;
  tips: number;
  otherEarnings: number;
}

export interface DeductionsInfo {
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  retirement401k: number;
  healthInsurance: number;
  otherDeductions: number;
}

export interface PayPeriodInfo {
  frequency: "weekly" | "bi_weekly" | "semi_monthly" | "monthly";
  periodStart: string;
  periodEnd: string;
  payDate: string;
  numberOfStubs: number;
  payDates: string[];
}

export interface YTDInfo {
  grossPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  netPay: number;
}

export interface IndividualStubData {
  periodStart: string;
  periodEnd: string;
  payDate: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeRate: number;
  salaryAmount: number;
  bonus: number;
  commission: number;
  tips: number;
  otherEarnings: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  retirement401k: number;
  healthInsurance: number;
  otherDeductions: number;
  ytdGrossPay: number;
  ytdFederalTax: number;
  ytdStateTax: number;
  ytdSocialSecurity: number;
  ytdMedicare: number;
  ytdNetPay: number;
}

export interface PaystubData {
  templateId: string;
  employer: EmployerInfo;
  employee: EmployeeInfo;
  earnings: EarningsInfo;
  deductions: DeductionsInfo;
  payPeriod: PayPeriodInfo;
  ytd: YTDInfo;
  stateCode: string;
  includeYTD: boolean;
  stubs: IndividualStubData[];
}

export const defaultPaystubData: PaystubData = {
  templateId: "classic",
  employer: {
    companyName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    ein: "",
    phone: "",
    email: "",
  },
  employee: {
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    ssnLastFour: "",
    employeeId: "",
  },
  earnings: {
    isHourly: true,
    regularHours: 80,
    hourlyRate: 25,
    salaryAmount: 0,
    overtimeHours: 0,
    overtimeRate: 37.5,
    bonus: 0,
    commission: 0,
    tips: 0,
    otherEarnings: 0,
  },
  deductions: {
    federalTax: 0,
    stateTax: 0,
    socialSecurity: 0,
    medicare: 0,
    retirement401k: 0,
    healthInsurance: 0,
    otherDeductions: 0,
  },
  payPeriod: {
    frequency: "bi_weekly",
    periodStart: new Date().toISOString().split("T")[0],
    periodEnd: new Date().toISOString().split("T")[0],
    payDate: new Date().toISOString().split("T")[0],
    numberOfStubs: 1,
    payDates: [new Date().toISOString().split("T")[0]],
  },
  ytd: {
    grossPay: 0,
    federalTax: 0,
    stateTax: 0,
    socialSecurity: 0,
    medicare: 0,
    netPay: 0,
  },
  stateCode: "CA",
  includeYTD: true,
};
