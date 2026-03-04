import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, Hash, X } from "lucide-react";
import { PaystubData } from "@/types/paystub";
import { StepErrors } from "@/hooks/useWizardValidation";

interface StepPayPeriodProps {
  data: PaystubData;
  onUpdateData: (data: Partial<PaystubData>) => void;
  errors?: StepErrors;
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-destructive">{message}</p> : null;

/** Given a start date string, frequency, and count, return an array of ISO date strings. */
function generatePayDates(
  startDate: string,
  frequency: "weekly" | "bi_weekly" | "semi_monthly" | "monthly",
  count: number
): string[] {
  if (!startDate || count < 1) return [];
  const dates: string[] = [];
  const base = new Date(startDate + "T12:00:00"); // noon to avoid DST issues

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base);
    switch (frequency) {
      case "weekly":
        d.setDate(d.getDate() - i * 7);
        break;
      case "bi_weekly":
        d.setDate(d.getDate() - i * 14);
        break;
      case "semi_monthly":
        d.setMonth(d.getMonth() - Math.floor(i / 2));
        if (i % 2 === 1) d.setDate(d.getDate() - 15);
        break;
      case "monthly":
        d.setMonth(d.getMonth() - i);
        break;
    }
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

const StepPayPeriod = ({ data, onUpdateData, errors = {} }: StepPayPeriodProps) => {
  const { numberOfStubs, frequency, payDate } = data.payPeriod;

  // Auto-generate pay dates when payDate, frequency, or numberOfStubs changes
  useEffect(() => {
    if (!payDate) return;
    const dates = generatePayDates(payDate, frequency, numberOfStubs);
    // Only update if dates actually changed
    const current = data.payPeriod.payDates;
    if (JSON.stringify(dates) !== JSON.stringify(current)) {
      onUpdateData({
        payPeriod: { ...data.payPeriod, payDates: dates },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payDate, frequency, numberOfStubs]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const unitPrice = 4.99;
  const totalPrice = (unitPrice * numberOfStubs).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Pay Period</h2>
        <p className="text-muted-foreground">Set the pay period dates and frequency</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pay Period Configuration</CardTitle>
          <CardDescription>Set the pay period and date information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pay Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(v: "weekly" | "bi_weekly" | "semi_monthly" | "monthly") =>
                  onUpdateData({
                    payPeriod: { ...data.payPeriod, frequency: v },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                  <SelectItem value="semi_monthly">Semi-Monthly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of Paystubs</Label>
              <Select
                value={String(numberOfStubs)}
                onValueChange={(v) =>
                  onUpdateData({
                    payPeriod: { ...data.payPeriod, numberOfStubs: parseInt(v) },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "Paystub" : "Paystubs"} — ${(unitPrice * n).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Period Start *</Label>
              <Input
                type="date"
                value={data.payPeriod.periodStart}
                className={errors.periodStart ? "border-destructive" : ""}
                onChange={(e) =>
                  onUpdateData({
                    payPeriod: { ...data.payPeriod, periodStart: e.target.value },
                  })
                }
              />
              <FieldError message={errors.periodStart} />
            </div>
            <div className="space-y-2">
              <Label>Period End *</Label>
              <Input
                type="date"
                value={data.payPeriod.periodEnd}
                className={errors.periodEnd ? "border-destructive" : ""}
                onChange={(e) =>
                  onUpdateData({
                    payPeriod: { ...data.payPeriod, periodEnd: e.target.value },
                  })
                }
              />
              <FieldError message={errors.periodEnd} />
            </div>
            <div className="space-y-2">
              <Label>Pay Date *</Label>
              <Input
                type="date"
                value={data.payPeriod.payDate}
                className={errors.payDate ? "border-destructive" : ""}
                onChange={(e) =>
                  onUpdateData({
                    payPeriod: { ...data.payPeriod, payDate: e.target.value },
                  })
                }
              />
              <FieldError message={errors.payDate} />
            </div>
          </div>

          {/* Generated Pay Dates Preview */}
          {numberOfStubs > 1 && data.payPeriod.payDates.length > 0 && (
            <div className="space-y-3 pt-2">
              <Label className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                Generated Pay Dates ({numberOfStubs} paystubs)
              </Label>
              <div className="flex flex-wrap gap-2">
                {data.payPeriod.payDates.map((date, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm py-1.5 px-3">
                    #{idx + 1} — {formatDate(date)}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Pay dates are auto-calculated based on the first pay date and frequency.
              </p>
            </div>
          )}

          {/* Price Summary */}
          {numberOfStubs > 1 && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {numberOfStubs} Paystubs × ${unitPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Each paystub uses the same employer, employee, and earnings info
                  </p>
                </div>
                <div className="text-xl font-bold text-foreground">${totalPrice}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4">
            <Switch
              id="ytd-toggle"
              checked={data.includeYTD}
              onCheckedChange={(checked) => onUpdateData({ includeYTD: checked })}
            />
            <Label htmlFor="ytd-toggle">Include Year-to-Date (YTD) totals</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepPayPeriod;
