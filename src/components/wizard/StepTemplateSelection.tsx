import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Lock } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  tags: string[];
}

const templates: Template[] = [
  {
    id: "classic",
    name: "Classic Professional",
    description: "Clean and professional design suitable for any industry",
    isPremium: false,
    tags: ["general", "corporate"],
  },
  {
    id: "modern",
    name: "Modern Minimal",
    description: "Sleek contemporary design with minimal styling",
    isPremium: false,
    tags: ["tech", "startup"],
  },
  {
    id: "corporate",
    name: "Corporate Executive",
    description: "Premium corporate design for executive-level employees",
    isPremium: false,
    tags: ["corporate", "finance"],
  },
  {
    id: "healthcare",
    name: "Healthcare Standard",
    description: "Specialized template for healthcare industry",
    isPremium: false,
    tags: ["healthcare", "medical"],
  },
  {
    id: "construction",
    name: "Construction & Trade",
    description: "Designed for construction and trade industries",
    isPremium: false,
    tags: ["construction", "trade"],
  },
  {
    id: "retail",
    name: "Retail & Hospitality",
    description: "Perfect for retail stores, restaurants and hotels",
    isPremium: false,
    tags: ["retail", "hospitality"],
  },
  {
    id: "education",
    name: "Education & Academic",
    description: "Tailored for schools, universities and education staff",
    isPremium: false,
    tags: ["education", "academic"],
  },
  {
    id: "government",
    name: "Government & Public",
    description: "Formal layout for government and public sector roles",
    isPremium: false,
    tags: ["government", "public"],
  },
  {
    id: "tech",
    name: "Tech Startup",
    description: "Modern layout with stock options and equity sections",
    isPremium: false,
    tags: ["tech", "startup"],
  },
  {
    id: "freelance",
    name: "Freelancer & Contractor",
    description: "Simplified format for independent contractors",
    isPremium: false,
    tags: ["freelance", "contractor"],
  },
  {
    id: "manufacturing",
    name: "Manufacturing & Logistics",
    description: "Includes shift differentials and overtime breakdown",
    isPremium: false,
    tags: ["manufacturing", "logistics"],
  },
  {
    id: "nonprofit",
    name: "Non-Profit Organization",
    description: "Clean template designed for non-profit organizations",
    isPremium: false,
    tags: ["nonprofit", "charity"],
  },
];

interface StepTemplateSelectionProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

const StepTemplateSelection = ({
  selectedTemplate,
  onSelectTemplate,
}: StepTemplateSelectionProps) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Choose Your Template
        </h2>
        <p className="text-muted-foreground">
          Select a professional template for your paystub
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          const isDisabled = template.isPremium;

          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all relative ${
                isSelected
                  ? "ring-2 ring-primary border-primary"
                  : isDisabled
                  ? "opacity-60"
                  : "hover:border-primary/50"
              }`}
              onClick={() => !isDisabled && onSelectTemplate(template.id)}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              {template.isPremium && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Pro
                  </Badge>
                </div>
              )}

              <CardHeader>
                {/* Template Preview Placeholder */}
                <div className="h-32 bg-muted rounded-md mb-4 flex items-center justify-center">
                  <div className="w-3/4 space-y-2">
                    <div className="h-3 bg-muted-foreground/20 rounded" />
                    <div className="h-2 bg-muted-foreground/20 rounded w-2/3" />
                    <div className="h-2 bg-muted-foreground/20 rounded w-1/2" />
                    <div className="mt-4 space-y-1">
                      <div className="h-1.5 bg-muted-foreground/10 rounded" />
                      <div className="h-1.5 bg-muted-foreground/10 rounded" />
                      <div className="h-1.5 bg-muted-foreground/10 rounded w-3/4" />
                    </div>
                  </div>
                </div>

                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StepTemplateSelection;
