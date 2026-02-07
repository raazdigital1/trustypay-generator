import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Calculator } from "lucide-react";
import { PaystubData } from "@/types/paystub";
import { TaxRate } from "@/hooks/useTaxRates";
import { StepErrors } from "@/hooks/useWizardValidation";

interface StepEarningsProps {
  data: PaystubData;
  onUpdateData: (data: Partial<PaystubData>) => void;
  taxRates: TaxRate[];
  loadError: string | null;
  errors?: StepErrors;
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-destructive">{message}</p> : null;

const StepEarnings = ({ data, onUpdateData, taxRates, loadError, errors = {} }: StepEarningsProps) => {
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | null>(null);

  useEffect(() => {
    if (taxRates.length > 0) {
      const currentRate = taxRates.find((r) => r.state_code === data.stateCode);
      if (currentRate) setSelectedTaxRate(currentRate);
    }
  }, [taxRates, data.stateCode]);

  // Auto-calculate taxes when earnings change
  useEffect(() => {
    if (!selectedTaxRate) return;

    const grossPay = data.earnings.isHourly
      ? data.earnings.regularHours * data.earnings.hourlyRate +
        data.earnings.overtimeHours * data.earnings.overtimeRate
      : data.earnings.salaryAmount;

    const totalGross =
      grossPay +
      data.earnings.bonus +
      data.earnings.commission +
      data.earnings.tips +
      data.earnings.otherEarnings;

    const federalTax = Math.round(totalGross * selectedTaxRate.federal_rate * 100) / 100;
    const stateTax = selectedTaxRate.has_state_tax
      ? Math.round(totalGross * selectedTaxRate.state_rate * 100) / 100
      : 0;
    const socialSecurity = Math.round(totalGross * selectedTaxRate.social_security_rate * 100) / 100;
    const medicare = Math.round(totalGross * selectedTaxRate.medicare_rate * 100) / 100;

    onUpdateData({
      deductions: {
        ...data.deductions,
        federalTax,
        stateTax,
        socialSecurity,
        medicare,
      },
    });
  }, [data.earnings, selectedTaxRate]);

  const handleStateChange = (stateCode: string) => {
    onUpdateData({ stateCode });
    const rate = taxRates.find((r) => r.state_code === stateCode);
    if (rate) setSelectedTaxRate(rate);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <DollarSign className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Earnings & Deductions</h2>
        <p className="text-muted-foreground">Enter pay details — taxes are calculated automatically</p>
      </div>

      {loadError && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          {loadError}
        </div>
      )}

      <div className="space-y-6">
        {/* Earnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Earnings</span>
              <div className="flex items-center gap-2">
                <Label htmlFor="hourly-toggle" className="text-sm font-normal">
                  {data.earnings.isHourly ? "Hourly" : "Salary"}
                </Label>
                <Switch
                  id="hourly-toggle"
                  checked={data.earnings.isHourly}
                  onCheckedChange={(checked) =>
                    onUpdateData({
                      earnings: { ...data.earnings, isHourly: checked },
                    })
                  }
                />
              </div>
            </CardTitle>
            <CardDescription>Enter regular pay and additional earnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.earnings.isHourly ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Regular Hours *</Label>
                  <Input
                    type="number"
                    value={data.earnings.regularHours}
                    className={errors.regularHours ? "border-destructive" : ""}
                    onChange={(e) =>
                      onUpdateData({
                        earnings: {
                          ...data.earnings,
                          regularHours: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                  <FieldError message={errors.regularHours} />
                </div>
                <div className="space-y-2">
                  <Label>Hourly Rate ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={data.earnings.hourlyRate}
                    className={errors.hourlyRate ? "border-destructive" : ""}
                    onChange={(e) =>
                      onUpdateData({
                        earnings: {
                          ...data.earnings,
                          hourlyRate: parseFloat(e.target.value) || 0,
                          overtimeRate: (parseFloat(e.target.value) || 0) * 1.5,
                        },
                      })
                    }
                  />
                  <FieldError message={errors.hourlyRate} />
                </div>
                <div className="space-y-2">
                  <Label>Overtime Hours</Label>
                  <Input
                    type="number"
                    value={data.earnings.overtimeHours}
                    onChange={(e) =>
                      onUpdateData({
                        earnings: {
                          ...data.earnings,
                          overtimeHours: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Overtime Rate (1.5x)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={data.earnings.overtimeRate}
                    disabled
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Salary Amount (per pay period) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.earnings.salaryAmount}
                  className={errors.salaryAmount ? "border-destructive" : ""}
                  onChange={(e) =>
                    onUpdateData({
                      earnings: {
                        ...data.earnings,
                        salaryAmount: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
                <FieldError message={errors.salaryAmount} />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Bonus ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.earnings.bonus}
                  onChange={(e) =>
                    onUpdateData({
                      earnings: {
                        ...data.earnings,
                        bonus: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Commission ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.earnings.commission}
                  onChange={(e) =>
                    onUpdateData({
                      earnings: {
                        ...data.earnings,
                        commission: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tips ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.earnings.tips}
                  onChange={(e) =>
                    onUpdateData({
                      earnings: {
                        ...data.earnings,
                        tips: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Other ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.earnings.otherEarnings}
                  onChange={(e) =>
                    onUpdateData({
                      earnings: {
                        ...data.earnings,
                        otherEarnings: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Deductions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Tax Deductions (Auto-Calculated)
            </CardTitle>
            <CardDescription>
              Based on {selectedTaxRate?.state_name || "selected state"} tax rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tax State</Label>
              <Select value={data.stateCode} onValueChange={handleStateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {taxRates.map((rate) => (
                    <SelectItem key={rate.state_code} value={rate.state_code}>
                      {rate.state_name} {!rate.has_state_tax && "(No State Tax)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Federal Tax</Label>
                <Input type="number" value={data.deductions.federalTax.toFixed(2)} disabled />
              </div>
              <div className="space-y-2">
                <Label>State Tax</Label>
                <Input type="number" value={data.deductions.stateTax.toFixed(2)} disabled />
              </div>
              <div className="space-y-2">
                <Label>Social Security</Label>
                <Input type="number" value={data.deductions.socialSecurity.toFixed(2)} disabled />
              </div>
              <div className="space-y-2">
                <Label>Medicare</Label>
                <Input type="number" value={data.deductions.medicare.toFixed(2)} disabled />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>401(k) ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.deductions.retirement401k}
                  onChange={(e) =>
                    onUpdateData({
                      deductions: {
                        ...data.deductions,
                        retirement401k: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Health Insurance ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.deductions.healthInsurance}
                  onChange={(e) =>
                    onUpdateData({
                      deductions: {
                        ...data.deductions,
                        healthInsurance: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Other Deductions ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.deductions.otherDeductions}
                  onChange={(e) =>
                    onUpdateData({
                      deductions: {
                        ...data.deductions,
                        otherDeductions: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StepEarnings;
