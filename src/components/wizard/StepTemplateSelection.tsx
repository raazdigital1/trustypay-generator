import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, Building2, Zap, Briefcase, Heart, HardHat, ShoppingBag, GraduationCap, Landmark, Cpu, UserCheck, Factory, HandHeart } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  tags: string[];
  icon: React.ElementType;
  palette: { bg: string; accent: string; text: string; line: string };
}

const templates: Template[] = [
  {
    id: "classic",
    name: "Classic Professional",
    description: "Clean and professional design suitable for any industry",
    isPremium: false,
    tags: ["general", "corporate"],
    icon: Building2,
    palette: { bg: "bg-slate-100", accent: "bg-slate-700", text: "text-slate-700", line: "bg-slate-300" },
  },
  {
    id: "modern",
    name: "Modern Minimal",
    description: "Sleek contemporary design with minimal styling",
    isPremium: false,
    tags: ["tech", "startup"],
    icon: Zap,
    palette: { bg: "bg-zinc-50", accent: "bg-zinc-900", text: "text-zinc-900", line: "bg-zinc-200" },
  },
  {
    id: "corporate",
    name: "Corporate Executive",
    description: "Premium corporate design for executive-level employees",
    isPremium: false,
    tags: ["corporate", "finance"],
    icon: Briefcase,
    palette: { bg: "bg-blue-50", accent: "bg-blue-800", text: "text-blue-800", line: "bg-blue-200" },
  },
  {
    id: "healthcare",
    name: "Healthcare Standard",
    description: "Specialized template for healthcare industry",
    isPremium: false,
    tags: ["healthcare", "medical"],
    icon: Heart,
    palette: { bg: "bg-teal-50", accent: "bg-teal-600", text: "text-teal-700", line: "bg-teal-200" },
  },
  {
    id: "construction",
    name: "Construction & Trade",
    description: "Designed for construction and trade industries",
    isPremium: false,
    tags: ["construction", "trade"],
    icon: HardHat,
    palette: { bg: "bg-amber-50", accent: "bg-amber-700", text: "text-amber-800", line: "bg-amber-200" },
  },
  {
    id: "retail",
    name: "Retail & Hospitality",
    description: "Perfect for retail stores, restaurants and hotels",
    isPremium: false,
    tags: ["retail", "hospitality"],
    icon: ShoppingBag,
    palette: { bg: "bg-rose-50", accent: "bg-rose-600", text: "text-rose-700", line: "bg-rose-200" },
  },
  {
    id: "education",
    name: "Education & Academic",
    description: "Tailored for schools, universities and education staff",
    isPremium: false,
    tags: ["education", "academic"],
    icon: GraduationCap,
    palette: { bg: "bg-indigo-50", accent: "bg-indigo-700", text: "text-indigo-700", line: "bg-indigo-200" },
  },
  {
    id: "government",
    name: "Government & Public",
    description: "Formal layout for government and public sector roles",
    isPremium: false,
    tags: ["government", "public"],
    icon: Landmark,
    palette: { bg: "bg-stone-100", accent: "bg-stone-700", text: "text-stone-700", line: "bg-stone-300" },
  },
  {
    id: "tech",
    name: "Tech Startup",
    description: "Modern layout with stock options and equity sections",
    isPremium: false,
    tags: ["tech", "startup"],
    icon: Cpu,
    palette: { bg: "bg-violet-50", accent: "bg-violet-600", text: "text-violet-700", line: "bg-violet-200" },
  },
  {
    id: "freelance",
    name: "Freelancer & Contractor",
    description: "Simplified format for independent contractors",
    isPremium: false,
    tags: ["freelance", "contractor"],
    icon: UserCheck,
    palette: { bg: "bg-emerald-50", accent: "bg-emerald-600", text: "text-emerald-700", line: "bg-emerald-200" },
  },
  {
    id: "manufacturing",
    name: "Manufacturing & Logistics",
    description: "Includes shift differentials and overtime breakdown",
    isPremium: false,
    tags: ["manufacturing", "logistics"],
    icon: Factory,
    palette: { bg: "bg-orange-50", accent: "bg-orange-700", text: "text-orange-800", line: "bg-orange-200" },
  },
  {
    id: "nonprofit",
    name: "Non-Profit Organization",
    description: "Clean template designed for non-profit organizations",
    isPremium: false,
    tags: ["nonprofit", "charity"],
    icon: HandHeart,
    palette: { bg: "bg-sky-50", accent: "bg-sky-600", text: "text-sky-700", line: "bg-sky-200" },
  },
];

const TemplatePreview = ({ template }: { template: Template }) => {
  const { palette, icon: Icon } = template;
  return (
    <div className={`h-36 ${palette.bg} rounded-md p-3 flex flex-col overflow-hidden border border-black/5`}>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-2">
        <div className={`h-3 w-16 ${palette.accent} rounded-sm opacity-80`} />
        <Icon className={`w-4 h-4 ${palette.text} opacity-60`} />
      </div>
      <div className={`h-px w-full ${palette.line} mb-2`} />
      {/* Two-column info */}
      <div className="flex gap-3 mb-2">
        <div className="flex-1 space-y-1">
          <div className={`h-1.5 ${palette.line} rounded w-full`} />
          <div className={`h-1.5 ${palette.line} rounded w-3/4`} />
          <div className={`h-1.5 ${palette.line} rounded w-1/2`} />
        </div>
        <div className="flex-1 space-y-1">
          <div className={`h-1.5 ${palette.line} rounded w-full`} />
          <div className={`h-1.5 ${palette.line} rounded w-2/3`} />
          <div className={`h-1.5 ${palette.line} rounded w-4/5`} />
        </div>
      </div>
      {/* Table rows */}
      <div className={`h-px w-full ${palette.line} mb-1.5`} />
      <div className="flex gap-1 mb-1">
        <div className={`h-2 flex-[2] ${palette.accent} rounded-sm opacity-20`} />
        <div className={`h-2 flex-1 ${palette.accent} rounded-sm opacity-15`} />
        <div className={`h-2 flex-1 ${palette.accent} rounded-sm opacity-15`} />
        <div className={`h-2 flex-1 ${palette.accent} rounded-sm opacity-25`} />
      </div>
      {[0.08, 0.12, 0.06].map((op, i) => (
        <div key={i} className="flex gap-1 mb-0.5">
          <div className={`h-1.5 flex-[2] ${palette.line} rounded-sm`} style={{ opacity: 0.5 + op }} />
          <div className={`h-1.5 flex-1 ${palette.line} rounded-sm`} />
          <div className={`h-1.5 flex-1 ${palette.line} rounded-sm`} />
          <div className={`h-1.5 flex-1 ${palette.accent} rounded-sm`} style={{ opacity: 0.3 + op }} />
        </div>
      ))}
      {/* Footer total */}
      <div className="mt-auto flex justify-end">
        <div className={`h-2.5 w-20 ${palette.accent} rounded-sm opacity-70`} />
      </div>
    </div>
  );
};

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
                <TemplatePreview template={template} />

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
