import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";
import { PaystubData } from "@/types/paystub";

interface StepPayPeriodProps {
  data: PaystubData;
  onUpdateData: (data: Partial<PaystubData>) => void;
}

const StepPayPeriod = ({ data, onUpdateData }: StepPayPeriodProps) => {
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
          <div className="space-y-2">
            <Label>Pay Frequency</Label>
            <Select
              value={data.payPeriod.frequency}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input
                type="date"
                value={data.payPeriod.periodStart}
                onChange={(e) =>
                  onUpdateData({
                    payPeriod: { ...data.payPeriod, periodStart: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input
                type="date"
                value={data.payPeriod.periodEnd}
                onChange={(e) =>
                  onUpdateData({
                    payPeriod: { ...data.payPeriod, periodEnd: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Pay Date</Label>
              <Input
                type="date"
                value={data.payPeriod.payDate}
                onChange={(e) =>
                  onUpdateData({
                    payPeriod: { ...data.payPeriod, payDate: e.target.value },
                  })
                }
              />
            </div>
          </div>

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
