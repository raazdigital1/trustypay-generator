import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Edit, Eye, Stamp, Download } from "lucide-react";
import { PaystubData } from "@/types/paystub";

interface StepPreviewProps {
  data: PaystubData;
  onEditStep?: (step: number) => void;
}

const StepPreview = ({ data, onEditStep }: StepPreviewProps) => {
  // Calculate totals
  const regularPay = data.earnings.isHourly
    ? data.earnings.regularHours * data.earnings.hourlyRate
    : data.earnings.salaryAmount;
  const overtimePay = data.earnings.overtimeHours * data.earnings.overtimeRate;
  const grossPay =
    regularPay +
    overtimePay +
    data.earnings.bonus +
    data.earnings.commission +
    data.earnings.tips +
    data.earnings.otherEarnings;

  const totalDeductions =
    data.deductions.federalTax +
    data.deductions.stateTax +
    data.deductions.socialSecurity +
    data.deductions.medicare +
    data.deductions.retirement401k +
    data.deductions.healthInsurance +
    data.deductions.otherDeductions;

  const netPay = grossPay - totalDeductions;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Eye className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Preview Your Paystub
        </h2>
        <p className="text-muted-foreground">
          Review the information below. Click edit to go back and make changes.
        </p>
      </div>

      {/* Edit Buttons */}
      {onEditStep && (
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <Button variant="outline" size="sm" onClick={() => onEditStep(2)}>
            <Edit className="w-3 h-3 mr-1" /> Employer
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditStep(3)}>
            <Edit className="w-3 h-3 mr-1" /> Employee
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditStep(4)}>
            <Edit className="w-3 h-3 mr-1" /> Earnings
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditStep(5)}>
            <Edit className="w-3 h-3 mr-1" /> Pay Period
          </Button>
        </div>
      )}

      {/* Paystub Preview Card */}
      <Card className="border-2 border-border shadow-elegant overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">
                {data.employer.companyName || "Company Name"}
              </h3>
              <p className="text-sm opacity-90">
                {data.employer.addressLine1 || "Address Line 1"}
              </p>
              <p className="text-sm opacity-90">
                {data.employer.city || "City"}, {data.employer.state || "ST"}{" "}
                {data.employer.zipCode || "00000"}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                EARNINGS STATEMENT
              </Badge>
              <p className="text-sm opacity-90">
                Pay Date: {formatDate(data.payPeriod.payDate)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                EMPLOYEE
              </h4>
              <p className="font-medium">
                {data.employee.firstName || "First"} {data.employee.lastName || "Last"}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.employee.addressLine1 || "Address"}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.employee.city || "City"}, {data.employee.state || "ST"}{" "}
                {data.employee.zipCode || "00000"}
              </p>
              {data.employee.ssnLastFour && (
                <p className="text-sm text-muted-foreground mt-1">
                  SSN: XXX-XX-{data.employee.ssnLastFour}
                </p>
              )}
            </div>
            <div className="text-right">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                PAY PERIOD
              </h4>
              <p className="text-sm">
                {formatDate(data.payPeriod.periodStart)} -{" "}
                {formatDate(data.payPeriod.periodEnd)}
              </p>
              {data.employee.employeeId && (
                <p className="text-sm text-muted-foreground mt-1">
                  Employee ID: {data.employee.employeeId}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Earnings */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
              EARNINGS
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>
                  {data.earnings.isHourly
                    ? `Regular Pay (${data.earnings.regularHours} hrs × ${formatCurrency(data.earnings.hourlyRate)})`
                    : "Salary"}
                </span>
                <span className="font-medium">{formatCurrency(regularPay)}</span>
              </div>
              {data.earnings.overtimeHours > 0 && (
                <div className="flex justify-between">
                  <span>
                    Overtime ({data.earnings.overtimeHours} hrs × {formatCurrency(data.earnings.overtimeRate)})
                  </span>
                  <span className="font-medium">{formatCurrency(overtimePay)}</span>
                </div>
              )}
              {data.earnings.bonus > 0 && (
                <div className="flex justify-between">
                  <span>Bonus</span>
                  <span className="font-medium">{formatCurrency(data.earnings.bonus)}</span>
                </div>
              )}
              {data.earnings.commission > 0 && (
                <div className="flex justify-between">
                  <span>Commission</span>
                  <span className="font-medium">{formatCurrency(data.earnings.commission)}</span>
                </div>
              )}
              {data.earnings.tips > 0 && (
                <div className="flex justify-between">
                  <span>Tips</span>
                  <span className="font-medium">{formatCurrency(data.earnings.tips)}</span>
                </div>
              )}
              {data.earnings.otherEarnings > 0 && (
                <div className="flex justify-between">
                  <span>Other Earnings</span>
                  <span className="font-medium">{formatCurrency(data.earnings.otherEarnings)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Gross Pay</span>
                <span>{formatCurrency(grossPay)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Deductions */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
              DEDUCTIONS
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Federal Income Tax</span>
                <span className="font-medium text-destructive">
                  -{formatCurrency(data.deductions.federalTax)}
                </span>
              </div>
              {data.deductions.stateTax > 0 && (
                <div className="flex justify-between">
                  <span>State Income Tax ({data.stateCode})</span>
                  <span className="font-medium text-destructive">
                    -{formatCurrency(data.deductions.stateTax)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Social Security (OASDI)</span>
                <span className="font-medium text-destructive">
                  -{formatCurrency(data.deductions.socialSecurity)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Medicare</span>
                <span className="font-medium text-destructive">
                  -{formatCurrency(data.deductions.medicare)}
                </span>
              </div>
              {data.deductions.retirement401k > 0 && (
                <div className="flex justify-between">
                  <span>401(k) Contribution</span>
                  <span className="font-medium text-destructive">
                    -{formatCurrency(data.deductions.retirement401k)}
                  </span>
                </div>
              )}
              {data.deductions.healthInsurance > 0 && (
                <div className="flex justify-between">
                  <span>Health Insurance</span>
                  <span className="font-medium text-destructive">
                    -{formatCurrency(data.deductions.healthInsurance)}
                  </span>
                </div>
              )}
              {data.deductions.otherDeductions > 0 && (
                <div className="flex justify-between">
                  <span>Other Deductions</span>
                  <span className="font-medium text-destructive">
                    -{formatCurrency(data.deductions.otherDeductions)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total Deductions</span>
                <span className="text-destructive">-{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="bg-accent/10 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">NET PAY</span>
              <span className="text-2xl font-bold text-accent">
                {formatCurrency(netPay)}
              </span>
            </div>
          </div>

          {/* Watermark Notice */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Stamp className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Free Sample Available</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  On the next step, you can download a <strong>free watermarked PDF</strong> to preview your paystub before purchasing.
                  The paid version is watermark-free.
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">
                <Download className="w-3 h-3 mr-1" />
                Free
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepPreview;
