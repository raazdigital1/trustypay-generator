import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, ArrowLeft, ArrowRight, Check } from "lucide-react";
import StepTemplateSelection from "@/components/wizard/StepTemplateSelection";
import StepEmployerDetails from "@/components/wizard/StepEmployerDetails";
import StepEmployeeDetails from "@/components/wizard/StepEmployeeDetails";
import StepEarnings from "@/components/wizard/StepEarnings";
import StepPayPeriod from "@/components/wizard/StepPayPeriod";
import StepPreview from "@/components/wizard/StepPreview";
import StepDownload from "@/components/wizard/StepDownload";
import { PaystubData, defaultPaystubData } from "@/types/paystub";
import { useTaxRates } from "@/hooks/useTaxRates";
import { validateStep, StepErrors } from "@/hooks/useWizardValidation";
import { toast } from "@/hooks/use-toast";

const steps = [
  { id: 1, name: "Template" },
  { id: 2, name: "Employer" },
  { id: 3, name: "Employee" },
  { id: 4, name: "Pay Period" },
  { id: 5, name: "Earnings" },
  { id: 6, name: "Preview" },
  { id: 7, name: "Download" },
];

const Create = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [paystubData, setPaystubData] = useState<PaystubData>(defaultPaystubData);
  const [stepErrors, setStepErrors] = useState<StepErrors>({});
  const { taxRates, loadError } = useTaxRates();

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    const errors = validateStep(currentStep, paystubData);
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      toast({
        title: "Please fix the errors",
        description: "Fill in all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }
    setStepErrors({});
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStepErrors({});
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setStepErrors({});
    setCurrentStep(step);
  };

  const updatePaystubData = (data: Partial<PaystubData>) => {
    setPaystubData((prev) => ({ ...prev, ...data }));
    // Clear errors for fields being updated
    if (Object.keys(stepErrors).length > 0) {
      const newErrors = { ...stepErrors };
      Object.keys(data).forEach((key) => {
        const val = data[key as keyof PaystubData];
        if (val && typeof val === 'object') {
          const nested = val as unknown as Record<string, unknown>;
          Object.keys(nested).forEach((nestedKey) => {
            if (newErrors[nestedKey] && nested[nestedKey]) {
              delete newErrors[nestedKey];
            }
          });
        }
      });
      setStepErrors(newErrors);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepTemplateSelection
            selectedTemplate={paystubData.templateId}
            onSelectTemplate={(templateId) => updatePaystubData({ templateId })}
          />
        );
      case 2:
        return (
          <StepEmployerDetails
            data={paystubData}
            onUpdateData={updatePaystubData}
            taxRates={taxRates}
            errors={stepErrors}
          />
        );
      case 3:
        return (
          <StepEmployeeDetails
            data={paystubData}
            onUpdateData={updatePaystubData}
            taxRates={taxRates}
            errors={stepErrors}
          />
        );
      case 4:
        return (
          <StepPayPeriod
            data={paystubData}
            onUpdateData={updatePaystubData}
            errors={stepErrors}
          />
        );
      case 5:
        return (
          <StepEarnings
            data={paystubData}
            onUpdateData={updatePaystubData}
            taxRates={taxRates}
            loadError={loadError}
            errors={stepErrors}
          />
        );
      case 6:
        return (
          <StepPreview
            data={paystubData}
            onEditStep={goToStep}
          />
        );
      case 7:
        return <StepDownload data={paystubData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                Paystub<span className="text-primary">Pro</span>
              </span>
            </Link>

            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => {
                    if (step.id < currentStep) goToStep(step.id);
                  }}
                  disabled={step.id > currentStep}
                  className={`flex items-center gap-1.5 ${
                    step.id < currentStep ? "cursor-pointer" : step.id === currentStep ? "" : "cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      step.id === currentStep
                        ? "bg-primary text-primary-foreground"
                        : step.id < currentStep
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={`hidden md:inline text-xs font-medium ${
                      step.id === currentStep
                        ? "text-primary"
                        : step.id < currentStep
                        ? "text-accent"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.name}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block w-6 lg:w-12 h-0.5 mx-1 ${
                      step.id < currentStep ? "bg-accent" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Step Content */}
      <main className="container mx-auto px-4 py-8">
        {renderStep()}
      </main>

      {/* Navigation Footer */}
      <footer className="border-t border-border bg-card sticky bottom-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </span>

            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                className="bg-gradient-primary hover:opacity-90"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button className="bg-gradient-primary hover:opacity-90">
                Complete
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Create;
