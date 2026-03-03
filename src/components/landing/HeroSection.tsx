import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Shield, Clock, FileText } from "lucide-react";

const HeroSection = () => {
  const features = [
    "All 50 States Compliant",
    "Bank-Accepted Format",
    "Auto Tax Calculations",
    "Instant PDF Download",
  ];

  return (
    <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 px-4 py-1.5">
              <Shield className="w-4 h-4 mr-2" />
              Trusted by 50,000+ Businesses
            </Badge>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
              Generate{" "}
              <span className="text-gradient-primary">USA-Compliant</span>{" "}
              Paystubs in{" "}
              <span className="relative inline-block">
                <span className="text-gradient-gold">60 Seconds</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 8C50 2 150 2 198 8" stroke="hsl(var(--warning))" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground max-w-lg">
              Professional paystub generator with automatic federal and state tax calculations. 
              Perfect for small businesses, freelancers, and household employers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/create">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 h-14">
                  Create Your Paystub
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14">
                  View Pricing
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Paystub Preview */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-3xl opacity-30" />
            
            <div className="relative bg-card rounded-2xl shadow-elegant border border-border overflow-hidden animate-float">
              {/* Header */}
              <div className="bg-gradient-primary p-6 text-primary-foreground">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm opacity-80">EMPLOYER</div>
                    <div className="text-lg font-semibold">Acme Corporation</div>
                    <div className="text-sm opacity-80">123 Business Ave, Suite 100</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-80">PAY PERIOD</div>
                    <div className="font-semibold">Jan 1 - Jan 15, 2024</div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Employee Info */}
                <div className="flex justify-between items-start pb-4 border-b border-border">
                  <div>
                    <div className="text-sm text-muted-foreground">EMPLOYEE</div>
                    <div className="font-semibold text-foreground">John M. Smith</div>
                    <div className="text-sm text-muted-foreground">Employee ID: EMP-2024-001</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">SSN (Last 4)</div>
                    <div className="font-semibold text-foreground">XXX-XX-1234</div>
                  </div>
                </div>

                {/* Earnings */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium text-muted-foreground">
                    <span>EARNINGS</span>
                    <span>AMOUNT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground">Regular Pay (80 hrs @ $25.00)</span>
                    <span className="font-semibold text-foreground">$2,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground">Overtime (8 hrs @ $37.50)</span>
                    <span className="font-semibold text-foreground">$300.00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold text-foreground">Gross Pay</span>
                    <span className="font-bold text-lg text-foreground">$2,300.00</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium text-muted-foreground">
                    <span>DEDUCTIONS</span>
                    <span>AMOUNT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Federal Tax</span>
                    <span className="text-destructive">-$322.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">State Tax (CA)</span>
                    <span className="text-destructive">-$184.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Social Security</span>
                    <span className="text-destructive">-$142.60</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Medicare</span>
                    <span className="text-destructive">-$33.35</span>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="bg-success/10 rounded-lg p-4 flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">Net Pay</span>
                  <span className="text-2xl font-bold text-success">$1,618.05</span>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-muted/50 px-6 py-4 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>PayStub Wizard - Verified Document</span>
                </div>
                <div className="flex items-center gap-2 text-success">
                  <Shield className="w-4 h-4" />
                  <span>Bank Accepted</span>
                </div>
              </div>
            </div>

            {/* Decorative badges */}
            <div className="absolute -right-4 top-1/4 bg-card shadow-lg rounded-lg p-3 border border-border animate-fade-in">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                <span className="text-sm font-medium text-foreground">Ready in 60s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
