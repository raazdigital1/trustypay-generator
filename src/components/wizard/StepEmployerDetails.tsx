import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { PaystubData } from "@/types/paystub";
import { TaxRate } from "@/hooks/useTaxRates";
import { StepErrors } from "@/hooks/useWizardValidation";

interface StepEmployerDetailsProps {
  data: PaystubData;
  onUpdateData: (data: Partial<PaystubData>) => void;
  taxRates: TaxRate[];
  errors?: StepErrors;
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-destructive">{message}</p> : null;

const StepEmployerDetails = ({ data, onUpdateData, taxRates, errors = {} }: StepEmployerDetailsProps) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Employer Information</h2>
        <p className="text-muted-foreground">Enter the company details that will appear on the paystub</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>This information identifies the employer on the paystub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                placeholder="Acme Corporation"
                value={data.employer.companyName}
                className={errors.companyName ? "border-destructive" : ""}
                onChange={(e) =>
                  onUpdateData({
                    employer: { ...data.employer, companyName: e.target.value },
                  })
                }
              />
              <FieldError message={errors.companyName} />
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
            <Label>Address Line 1 *</Label>
            <Input
              placeholder="123 Business St"
              value={data.employer.addressLine1}
              className={errors.addressLine1 ? "border-destructive" : ""}
              onChange={(e) =>
                onUpdateData({
                  employer: { ...data.employer, addressLine1: e.target.value },
                })
              }
            />
            <FieldError message={errors.addressLine1} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                placeholder="New York"
                value={data.employer.city}
                className={errors.city ? "border-destructive" : ""}
                onChange={(e) =>
                  onUpdateData({
                    employer: { ...data.employer, city: e.target.value },
                  })
                }
              />
              <FieldError message={errors.city} />
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Select
                value={data.employer.state}
                onValueChange={(v) =>
                  onUpdateData({ employer: { ...data.employer, state: v } })
                }
              >
                <SelectTrigger className={errors.state ? "border-destructive" : ""}>
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
              <FieldError message={errors.state} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>ZIP Code *</Label>
              <Input
                placeholder="10001"
                value={data.employer.zipCode}
                className={errors.zipCode ? "border-destructive" : ""}
                onChange={(e) =>
                  onUpdateData({
                    employer: { ...data.employer, zipCode: e.target.value },
                  })
                }
              />
              <FieldError message={errors.zipCode} />
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
    </div>
  );
};

export default StepEmployerDetails;
