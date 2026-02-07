import { PaystubData } from "@/types/paystub";

export interface StepErrors {
  [field: string]: string;
}

export function validateStep(step: number, data: PaystubData): StepErrors {
  const errors: StepErrors = {};

  switch (step) {
    case 1:
      // Template - always valid (has default)
      break;

    case 2:
      // Employer details
      if (!data.employer.companyName.trim()) {
        errors.companyName = "Company name is required";
      }
      if (!data.employer.addressLine1.trim()) {
        errors.addressLine1 = "Address is required";
      }
      if (!data.employer.city.trim()) {
        errors.city = "City is required";
      }
      if (!data.employer.state) {
        errors.state = "State is required";
      }
      if (!data.employer.zipCode.trim()) {
        errors.zipCode = "ZIP code is required";
      }
      break;

    case 3:
      // Employee details
      if (!data.employee.firstName.trim()) {
        errors.firstName = "First name is required";
      }
      if (!data.employee.lastName.trim()) {
        errors.lastName = "Last name is required";
      }
      if (!data.employee.addressLine1.trim()) {
        errors.addressLine1 = "Address is required";
      }
      if (!data.employee.city.trim()) {
        errors.city = "City is required";
      }
      if (!data.employee.state) {
        errors.state = "State is required";
      }
      if (!data.employee.zipCode.trim()) {
        errors.zipCode = "ZIP code is required";
      }
      break;

    case 4:
      // Earnings
      if (data.earnings.isHourly) {
        if (data.earnings.regularHours <= 0) {
          errors.regularHours = "Regular hours must be greater than 0";
        }
        if (data.earnings.hourlyRate <= 0) {
          errors.hourlyRate = "Hourly rate must be greater than 0";
        }
      } else {
        if (data.earnings.salaryAmount <= 0) {
          errors.salaryAmount = "Salary amount must be greater than 0";
        }
      }
      break;

    case 5:
      // Pay period
      if (!data.payPeriod.periodStart) {
        errors.periodStart = "Period start date is required";
      }
      if (!data.payPeriod.periodEnd) {
        errors.periodEnd = "Period end date is required";
      }
      if (!data.payPeriod.payDate) {
        errors.payDate = "Pay date is required";
      }
      if (
        data.payPeriod.periodStart &&
        data.payPeriod.periodEnd &&
        data.payPeriod.periodStart > data.payPeriod.periodEnd
      ) {
        errors.periodEnd = "End date must be after start date";
      }
      break;

    case 6:
      // Preview - always valid
      break;

    case 7:
      // Download - always valid
      break;
  }

  return errors;
}
