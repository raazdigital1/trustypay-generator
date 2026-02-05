import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, User, DollarSign, Calculator, Calendar } from "lucide-react";
import { PaystubData } from "@/types/paystub";
import { supabase } from "@/integrations/supabase/client";

interface TaxRate {
  state_code: string;
  state_name: string;
  federal_rate: number;
  state_rate: number;
  social_security_rate: number;
  medicare_rate: number;
  has_state_tax: boolean;
}

interface StepDataEntryProps {
  data: PaystubData;
  onUpdateData: (data: Partial<PaystubData>) => void;
}

const StepDataEntry = ({ data, onUpdateData }: StepDataEntryProps) => {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | null>(null);

  // Fetch tax rates
  useEffect(() => {
    const fetchTaxRates = async () => {
      const { data: rates } = await supabase
        .from("tax_rates")
        .select("*")
        .order("state_name");
      if (rates) {
        setTaxRates(rates);
        const currentRate = rates.find((r) => r.state_code === data.stateCode);
        if (currentRate) setSelectedTaxRate(currentRate);
      }
    };
    fetchTaxRates();
  }, [data.stateCode]);

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
  }, [
    data.earnings,
    selectedTaxRate,
  ]);

  const handleStateChange = (stateCode: string) => {
    onUpdateData({ stateCode });
    const rate = taxRates.find((r) => r.state_code === stateCode);
    if (rate) setSelectedTaxRate(rate);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Enter Paystub Details
        </h2>
        <p className="text-muted-foreground">
          Fill in the employer, employee, and earnings information
        </p>
      </div>

      <Tabs defaultValue="employer" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="employer" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Employer</span>
          </TabsTrigger>
          <TabsTrigger value="employee" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Employee</span>
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Earnings</span>
          </TabsTrigger>
          <TabsTrigger value="period" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Pay Period</span>
          </TabsTrigger>
        </TabsList>

        {/* Employer Tab */}
        <TabsContent value="employer">
          <Card>
            <CardHeader>
              <CardTitle>Employer Information</CardTitle>
              <CardDescription>Enter the company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    placeholder="Acme Corporation"
                    value={data.employer.companyName}
                    onChange={(e) =>
                      onUpdateData({
                        employer: { ...data.employer, companyName: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>EIN (Optional)</Label>
                  <Input
                    placeholder="XX-XXXXXXX"
                    value={data.employer.ein}
                    onChange={(e) =>
                      onUpdateData({
                        employer: { ...data.employer, ein: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address Line 1</Label>
                <Input
                  placeholder="123 Business St"
                  value={data.employer.addressLine1}
                  onChange={(e) =>
                    onUpdateData({
                      employer: { ...data.employer, addressLine1: e.target.value },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    placeholder="New York"
                    value={data.employer.city}
                    onChange={(e) =>
                      onUpdateData({
                        employer: { ...data.employer, city: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={data.employer.state}
                    onValueChange={(v) =>
                      onUpdateData({ employer: { ...data.employer, state: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxRates.map((rate) => (
                        <SelectItem key={rate.state_code} value={rate.state_code}>
                          {rate.state_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>ZIP Code</Label>
                  <Input
                    placeholder="10001"
                    value={data.employer.zipCode}
                    onChange={(e) =>
                      onUpdateData({
                        employer: { ...data.employer, zipCode: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="(555) 123-4567"
                    value={data.employer.phone}
                    onChange={(e) =>
                      onUpdateData({
                        employer: { ...data.employer, phone: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="payroll@company.com"
                    value={data.employer.email}
                    onChange={(e) =>
                      onUpdateData({
                        employer: { ...data.employer, email: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Tab */}
        <TabsContent value="employee">
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
              <CardDescription>Enter the employee details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    placeholder="John"
                    value={data.employee.firstName}
                    onChange={(e) =>
                      onUpdateData({
                        employee: { ...data.employee, firstName: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    placeholder="Doe"
                    value={data.employee.lastName}
                    onChange={(e) =>
                      onUpdateData({
                        employee: { ...data.employee, lastName: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SSN (Last 4 digits)</Label>
                  <Input
                    placeholder="XXXX"
                    maxLength={4}
                    value={data.employee.ssnLastFour}
                    onChange={(e) =>
                      onUpdateData({
                        employee: { ...data.employee, ssnLastFour: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input
                    placeholder="EMP-001"
                    value={data.employee.employeeId}
                    onChange={(e) =>
                      onUpdateData({
                        employee: { ...data.employee, employeeId: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address Line 1</Label>
                <Input
                  placeholder="456 Employee Ave"
                  value={data.employee.addressLine1}
                  onChange={(e) =>
                    onUpdateData({
                      employee: { ...data.employee, addressLine1: e.target.value },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    placeholder="New York"
                    value={data.employee.city}
                    onChange={(e) =>
                      onUpdateData({
                        employee: { ...data.employee, city: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={data.employee.state}
                    onValueChange={(v) =>
                      onUpdateData({ employee: { ...data.employee, state: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxRates.map((rate) => (
                        <SelectItem key={rate.state_code} value={rate.state_code}>
                          {rate.state_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>ZIP Code</Label>
                  <Input
                    placeholder="10001"
                    value={data.employee.zipCode}
                    onChange={(e) =>
                      onUpdateData({
                        employee: { ...data.employee, zipCode: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings">
          <div className="space-y-6">
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
                      <Label>Regular Hours</Label>
                      <Input
                        type="number"
                        value={data.earnings.regularHours}
                        onChange={(e) =>
                          onUpdateData({
                            earnings: {
                              ...data.earnings,
                              regularHours: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hourly Rate ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={data.earnings.hourlyRate}
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
                    <Label>Salary Amount (per pay period)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={data.earnings.salaryAmount}
                      onChange={(e) =>
                        onUpdateData({
                          earnings: {
                            ...data.earnings,
                            salaryAmount: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
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
                    <Input
                      type="number"
                      value={data.deductions.federalTax.toFixed(2)}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State Tax</Label>
                    <Input
                      type="number"
                      value={data.deductions.stateTax.toFixed(2)}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Social Security</Label>
                    <Input
                      type="number"
                      value={data.deductions.socialSecurity.toFixed(2)}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Medicare</Label>
                    <Input
                      type="number"
                      value={data.deductions.medicare.toFixed(2)}
                      disabled
                    />
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
        </TabsContent>

        {/* Pay Period Tab */}
        <TabsContent value="period">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StepDataEntry;
