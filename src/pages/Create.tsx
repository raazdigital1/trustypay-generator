import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, ArrowLeft, ArrowRight } from "lucide-react";
import StepTemplateSelection from "@/components/wizard/StepTemplateSelection";
import StepDataEntry from "@/components/wizard/StepDataEntry";
import StepPreview from "@/components/wizard/StepPreview";
import StepDownload from "@/components/wizard/StepDownload";
import { PaystubData, defaultPaystubData } from "@/types/paystub";

const steps = [
  { id: 1, name: "Template", description: "Choose your design" },
  { id: 2, name: "Details", description: "Enter information" },
  { id: 3, name: "Preview", description: "Review your paystub" },
  { id: 4, name: "Download", description: "Get your document" },
];

const Create = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [paystubData, setPaystubData] = useState<PaystubData>(defaultPaystubData);

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updatePaystubData = (data: Partial<PaystubData>) => {
    setPaystubData((prev) => ({ ...prev, ...data }));
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
          <StepDataEntry
            data={paystubData}
            onUpdateData={updatePaystubData}
          />
        );
      case 3:
        return <StepPreview data={paystubData} />;
      case 4:
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

            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  step.id === currentStep
                    ? "text-primary"
                    : step.id < currentStep
                    ? "text-accent"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-2 ${
                    step.id === currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id < currentStep
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{step.name}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
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
