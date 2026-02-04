import { Shield, Lock, Building2, FileCheck, Award, CheckCircle } from "lucide-react";

const TrustIndicators = () => {
  const trustBadges = [
    {
      icon: Shield,
      title: "SSL Secured",
      description: "256-bit encryption",
    },
    {
      icon: Building2,
      title: "Bank Accepted",
      description: "Meets requirements",
    },
    {
      icon: FileCheck,
      title: "IRS Compliant",
      description: "Federal standards",
    },
    {
      icon: Lock,
      title: "Data Protection",
      description: "Auto-deleted in 48hrs",
    },
    {
      icon: Award,
      title: "50 States",
      description: "Full compliance",
    },
    {
      icon: CheckCircle,
      title: "Verified Format",
      description: "Professional quality",
    },
  ];

  const mediaLogos = [
    "Forbes",
    "Inc.",
    "Entrepreneur",
    "Business Insider",
    "TechCrunch",
  ];

  return (
    <section className="py-12 lg:py-16 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {trustBadges.map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col items-center text-center p-4 bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <badge.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{badge.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
            </div>
          ))}
        </div>

        {/* Media Logos */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-6">As Featured In</p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
            {mediaLogos.map((logo) => (
              <div
                key={logo}
                className="text-2xl font-display font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;
