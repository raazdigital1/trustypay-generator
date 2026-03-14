import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Edit, Eye, Stamp, Download, ChevronDown, ChevronUp } from "lucide-react";
import { PaystubData, IndividualStubData } from "@/types/paystub";
import { TaxRate } from "@/hooks/useTaxRates";
import {
  calculateGrossPay,
  calculateTotalDeductions,
  recalculateAllStubs,
} from "@/lib/stub-calculations";

interface StepPreviewProps {
  data: PaystubData;
  onEditStep?: (step: number) => void;
  onUpdateStubs?: (stubs: IndividualStubData[]) => void;
  taxRate?: TaxRate | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

interface StubCardProps {
  stub: IndividualStubData;
  index: number;
  total: number;
  isHourly: boolean;
  includeYTD: boolean;
  employerName: string;
  employeeName: string;
  stateCode: string;
  onChange: (field: keyof IndividualStubData, value: number | string) => void;
}

const StubCard = ({
  stub,
  index,
  total,
  isHourly,
  includeYTD,
  employerName,
  employeeName,
  stateCode,
  onChange,
}: StubCardProps) => {
  const [expanded, setExpanded] = useState(total === 1);
  const grossPay = calculateGrossPay(stub, isHourly);
  const totalDeductions = calculateTotalDeductions(stub);
  const netPay = grossPay - totalDeductions;

  const numField = (
    label: string,
    field: keyof IndividualStubData,
    step = "0.01"
  ) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step={step}
        value={stub[field] as number}
        onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
        className="h-8 text-sm"
      />
    </div>
  );

  return (
    <Card className="border border-border overflow-hidden">
      {/* Compact header */}
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs font-mono">
            #{index + 1}
          </Badge>
          <div>
            <p className="text-sm font-medium text-foreground">
              {formatDate(stub.periodStart)} — {formatDate(stub.periodEnd)}
            </p>
            <p className="text-xs text-muted-foreground">
              Pay Date: {formatDate(stub.payDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Gross</p>
            <p className="text-sm font-semibold text-foreground">{formatCurrency(grossPay)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Net</p>
            <p className="text-sm font-bold text-accent">{formatCurrency(netPay)}</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <CardContent className="pt-0 px-4 pb-4 space-y-4">
          <Separator />

          {/* Pay Period Dates */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Pay Period
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Period Start</Label>
                <Input
                  type="date"
                  value={stub.periodStart}
                  onChange={(e) => onChange("periodStart", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Period End</Label>
                <Input
                  type="date"
                  value={stub.periodEnd}
                  onChange={(e) => onChange("periodEnd", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pay Date</Label>
                <Input
                  type="date"
                  value={stub.payDate}
                  onChange={(e) => onChange("payDate", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Earnings
            </h4>
            {isHourly ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {numField("Regular Hours", "regularHours", "1")}
                {numField("Hourly Rate ($)", "hourlyRate")}
                {numField("Overtime Hours", "overtimeHours", "1")}
                {numField("OT Rate ($)", "overtimeRate")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {numField("Salary Amount ($)", "salaryAmount")}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {numField("Bonus ($)", "bonus")}
              {numField("Commission ($)", "commission")}
              {numField("Tips ($)", "tips")}
              {numField("Other ($)", "otherEarnings")}
            </div>
            <div className="mt-2 flex justify-between text-sm font-semibold border-t pt-2">
              <span>Gross Pay</span>
              <span>{formatCurrency(grossPay)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Deductions (auto-calculated)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {numField("Federal Tax ($)", "federalTax")}
              {numField(`State Tax ($)`, "stateTax")}
              {numField("Social Security ($)", "socialSecurity")}
              {numField("Medicare ($)", "medicare")}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {numField("401(k) ($)", "retirement401k")}
              {numField("Health Ins ($)", "healthInsurance")}
              {numField("Other Ded ($)", "otherDeductions")}
            </div>
            <div className="mt-2 flex justify-between text-sm font-semibold border-t pt-2 text-destructive">
              <span>Total Deductions</span>
              <span>-{formatCurrency(totalDeductions)}</span>
            </div>
          </div>

          {/* Net Pay */}
          <div className="bg-accent/10 p-3 rounded-lg flex justify-between items-center">
            <span className="text-sm font-semibold">NET PAY</span>
            <span className="text-lg font-bold text-accent">{formatCurrency(netPay)}</span>
          </div>

          {/* YTD Summary */}
          {includeYTD && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Year-to-Date
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">YTD Gross</span>
                  <span className="font-medium">{formatCurrency(stub.ytdGrossPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">YTD Fed Tax</span>
                  <span className="font-medium">{formatCurrency(stub.ytdFederalTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">YTD State Tax</span>
                  <span className="font-medium">{formatCurrency(stub.ytdStateTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">YTD SS</span>
                  <span className="font-medium">{formatCurrency(stub.ytdSocialSecurity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">YTD Medicare</span>
                  <span className="font-medium">{formatCurrency(stub.ytdMedicare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">YTD Net</span>
                  <span className="font-bold text-accent">{formatCurrency(stub.ytdNetPay)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

const StepPreview = ({ data, onEditStep, onUpdateStubs, taxRate }: StepPreviewProps) => {
  const stubs = data.stubs;

  const handleStubChange = (
    stubIndex: number,
    field: keyof IndividualStubData,
    value: number | string
  ) => {
    if (!onUpdateStubs) return;
    const newStubs = stubs.map((s, i) =>
      i === stubIndex ? { ...s, [field]: value } : s
    );
    const recalculated = recalculateAllStubs(
      newStubs,
      data.earnings.isHourly,
      data.includeYTD,
      taxRate || null
    );
    onUpdateStubs(recalculated);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Eye className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Preview Your Paystub{stubs.length > 1 ? "s" : ""}
        </h2>
        <p className="text-muted-foreground">
          Review and edit each paystub below. Click a card to expand and modify fields.
        </p>
        {stubs.length > 1 && (
          <Badge variant="secondary" className="mt-2">
            {stubs.length} Paystubs — {data.includeYTD ? "YTD Cumulative" : "YTD Per Period"}
          </Badge>
        )}
      </div>

      {/* Quick edit step buttons */}
      {onEditStep && (
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <Button variant="outline" size="sm" onClick={() => onEditStep(2)}>
            <Edit className="w-3 h-3 mr-1" /> Employer
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditStep(3)}>
            <Edit className="w-3 h-3 mr-1" /> Employee
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditStep(4)}>
            <Edit className="w-3 h-3 mr-1" /> Pay Period
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditStep(5)}>
            <Edit className="w-3 h-3 mr-1" /> Earnings
          </Button>
        </div>
      )}

      {/* Stub Cards */}
      <div className="space-y-3">
        {stubs.map((stub, idx) => (
          <StubCard
            key={idx}
            stub={stub}
            index={idx}
            total={stubs.length}
            isHourly={data.earnings.isHourly}
            includeYTD={data.includeYTD}
            employerName={data.employer.companyName}
            employeeName={`${data.employee.firstName} ${data.employee.lastName}`}
            stateCode={data.stateCode}
            onChange={(field, value) => handleStubChange(idx, field, value)}
          />
        ))}
      </div>

      {/* Price summary */}
      {stubs.length > 1 && (
        <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Total: {stubs.length} × $4.99 = <strong className="text-foreground">${(stubs.length * 4.99).toFixed(2)}</strong>
          </p>
        </div>
      )}

      {/* Watermark Notice */}
      <Card className="mt-6 border-muted">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Stamp className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Free Sample Available</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                On the next step, you can download a <strong>free watermarked PDF</strong> to preview before purchasing.
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">
              <Download className="w-3 h-3 mr-1" />
              Free
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepPreview;
