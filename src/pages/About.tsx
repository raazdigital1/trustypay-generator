import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Award, Clock } from "lucide-react";

const About = () => {
  const stats = [
    { icon: Users, value: "50,000+", label: "Happy Customers" },
    { icon: Shield, value: "100%", label: "Secure & Compliant" },
    { icon: Award, value: "50", label: "States Supported" },
    { icon: Clock, value: "60s", label: "Average Generation Time" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About PaystubPro
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to make professional payroll documentation accessible
              to small businesses, freelancers, and household employers everywhere.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 -mt-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="border-border">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
            <div className="prose prose-lg text-muted-foreground space-y-4">
              <p>
                PaystubPro was founded in 2024 with a simple idea: creating professional
                paystubs shouldn't require expensive payroll software or accounting expertise.
              </p>
              <p>
                As a small business owner, our founder struggled to find an affordable,
                easy-to-use solution for generating compliant paystubs for employees.
                The existing options were either too expensive, too complicated, or
                didn't meet state-specific requirements.
              </p>
              <p>
                Today, PaystubPro serves thousands of small businesses, freelancers,
                and household employers across all 50 US states. Our platform automatically
                calculates federal and state taxes, ensuring every paystub meets
                compliance requirements.
              </p>
              <p>
                We believe in transparency, security, and simplicity. That's why we've
                built a platform that lets you generate professional paystubs in under
                60 seconds, with bank-grade security and automatic data deletion to
                protect your sensitive information.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Security First</h3>
                  <p className="text-muted-foreground">
                    Your data is encrypted at rest and in transit. Sensitive information
                    is automatically deleted after 48 hours.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Accuracy Matters</h3>
                  <p className="text-muted-foreground">
                    Our tax calculations are regularly updated to reflect current federal
                    and state rates, ensuring compliance.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Customer Success</h3>
                  <p className="text-muted-foreground">
                    We're here to help you succeed. Our support team is available to
                    answer questions and guide you through the process.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
