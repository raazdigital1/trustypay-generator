import { useState } from "react";
import { Check, Star, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PRO_PRICE_ID = "price_1T6P0BGf3K1hj4vvDSuYmNEv";

const PricingSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleProCheckout = async () => {
    if (!user) {
      navigate("/signup?plan=pro");
      return;
    }

    setCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PRO_PRICE_ID },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    } finally {
      setCheckingOut(false);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out our service",
      features: [
        "1 paystub per month",
        "Watermarked PDF download",
        "Basic template",
        "Federal tax calculations",
        "Email support",
      ],
      cta: "Get Started Free",
      variant: "outline" as const,
      popular: false,
      action: "link" as const,
    },
    {
      name: "Pro",
      price: "$29.99",
      period: "/month",
      description: "Best for businesses with employees",
      features: [
        "Unlimited paystubs",
        "No watermarks",
        "All 5 premium templates",
        "All 50 state tax calculations",
        "PDF, PNG & Excel exports",
        "Year-to-date tracking",
        "Save employer/employee profiles",
        "Priority email support",
        "Bulk generation",
      ],
      cta: "Start Pro Trial",
      variant: "default" as const,
      popular: true,
      action: "checkout" as const,
    },
    {
      name: "Pay-Per-Use",
      price: "$4.99",
      period: "/paystub",
      description: "For occasional users",
      features: [
        "No subscription required",
        "No watermarks",
        "All premium templates",
        "All 50 state tax calculations",
        "PDF, PNG & Excel exports",
        "Year-to-date tracking",
        "Email support",
      ],
      cta: "Create Paystub",
      variant: "outline" as const,
      popular: false,
      action: "link" as const,
    },
  ];

  return (
    <section id="pricing" className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
            Simple, Transparent{" "}
            <span className="text-gradient-primary">Pricing</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that works best for your needs. All plans include our
            bank-accepted format and compliance guarantee.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 bg-card rounded-2xl border ${
                plan.popular
                  ? "border-primary shadow-xl scale-105 z-10"
                  : "border-border shadow-lg"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground px-4 py-1">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Most Popular
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground ml-1">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.action === "checkout" ? (
                <Button
                  variant={plan.variant}
                  className={`w-full h-12 text-base ${
                    plan.popular ? "bg-gradient-primary hover:opacity-90" : ""
                  }`}
                  onClick={handleProCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting...
                    </span>
                  ) : (
                    plan.cta
                  )}
                </Button>
              ) : (
                <Link to="/create">
                  <Button
                    variant={plan.variant}
                    className={`w-full h-12 text-base ${
                      plan.popular ? "bg-gradient-primary hover:opacity-90" : ""
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-success/10 rounded-full">
            <Sparkles className="w-5 h-5 text-success" />
            <span className="text-success font-medium">
              30-Day Money-Back Guarantee on Pro Plan
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
