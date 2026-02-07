import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";
import { PaystubData } from "@/types/paystub";
import { TaxRate } from "@/hooks/useTaxRates";
import { StepErrors } from "@/hooks/useWizardValidation";

interface StepEmployeeDetailsProps {
  data: PaystubData;
  onUpdateData: (data: Partial<PaystubData>) => void;
  taxRates: TaxRate[];
  errors?: StepErrors;
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-destructive">{message}</p> : null;

const StepEmployeeDetails = ({ data, onUpdateData, taxRates, errors = {} }: StepEmployeeDetailsProps) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <User className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Employee Information</h2>
        <p className="text-muted-foreground">Enter the employee details for the paystub</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
          <CardDescription>This information identifies the employee on the paystub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                placeholder="John"
                value={data.employee.firstName}
                className={errors.firstName ? "border-destructive" : ""}
                onChange={(e) =>
                  onUpdateData({
                    employee: { ...data.employee, firstName: e.target.value },
                  })
                }
              />
              <FieldError message={errors.firstName} />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                placeholder="Doe"
                value={data.employee.lastName}
                className={errors.lastName ? "border-destructive" : ""}
                onChange={(e) =>
                  onUpdateData({
                    employee: { ...data.employee, lastName: e.target.value },
                  })
                }
              />
              <FieldError message={errors.lastName} />
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
            <Label>Address Line 1 *</Label>
            <Input
              placeholder="456 Employee Ave"
              value={data.employee.addressLine1}
              className={errors.addressLine1 ? "border-destructive" : ""}
              onChange={(e) =>
                onUpdateData({
                  employee: { ...data.employee, addressLine1: e.target.value },
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
                value={data.employee.city}
                className={errors.city ? "border-destructive" : ""}
                onChange={(e) =>
                  onUpdateData({
                    employee: { ...data.employee, city: e.target.value },
                  })
                }
              />
              <FieldError message={errors.city} />
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Select
                value={data.employee.state}
                onValueChange={(v) =>
                  onUpdateData({ employee: { ...data.employee, state: v } })
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
                value={data.employee.zipCode}
                className={errors.zipCode ? "border-destructive" : ""}
                onChange={(e) =>
                  onUpdateData({
                    employee: { ...data.employee, zipCode: e.target.value },
                  })
                }
              />
              <FieldError message={errors.zipCode} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepEmployeeDetails;
