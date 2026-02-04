import { 
  Calculator, 
  FileText, 
  Clock, 
  Shield, 
  MapPin, 
  Download,
  Users,
  TrendingUp,
  Zap
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Calculator,
      title: "Automatic Tax Calculations",
      description: "Federal, state, Social Security, and Medicare taxes calculated automatically for all 50 states.",
      color: "primary",
    },
    {
      icon: MapPin,
      title: "50-State Compliance",
      description: "State-specific tax rules, overtime regulations, and required fields automatically applied.",
      color: "accent",
    },
    {
      icon: Clock,
      title: "Generate in 60 Seconds",
      description: "Quick and easy wizard guides you through creating professional paystubs fast.",
      color: "warning",
    },
    {
      icon: FileText,
      title: "Multiple Templates",
      description: "Choose from 5 professional designs suited for different industries and preferences.",
      color: "primary",
    },
    {
      icon: Download,
      title: "Multiple Formats",
      description: "Download as PDF, PNG, or Excel. Print-ready and bank-accepted formats.",
      color: "accent",
    },
    {
      icon: Shield,
      title: "Bank-Accepted Format",
      description: "Professional format accepted by banks, lenders, and government agencies.",
      color: "success",
    },
    {
      icon: TrendingUp,
      title: "Year-to-Date Tracking",
      description: "Automatic YTD calculations for earnings, taxes, and deductions.",
      color: "warning",
    },
    {
      icon: Users,
      title: "Employer & Employee Profiles",
      description: "Save profiles for quick re-use and duplicate previous paystubs easily.",
      color: "primary",
    },
    {
      icon: Zap,
      title: "Real-Time Preview",
      description: "See your paystub update live as you enter information.",
      color: "accent",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      primary: "bg-primary/10 text-primary",
      accent: "bg-accent/10 text-accent",
      warning: "bg-warning/10 text-warning",
      success: "bg-success/10 text-success",
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  return (
    <section id="features" className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Features
          </span>
          <h2 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
            Everything You Need to Create{" "}
            <span className="text-gradient-primary">Professional Paystubs</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Our powerful paystub generator handles complex calculations automatically,
            ensuring accuracy and compliance every time.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-lg ${getColorClasses(feature.color)} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
