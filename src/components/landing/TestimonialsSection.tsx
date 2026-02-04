import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Small Business Owner",
      company: "Johnson's Cleaning Services",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      content: "PaystubPro has been a game-changer for my cleaning business. I can create professional paystubs for my 12 employees in minutes. The automatic tax calculations save me hours every pay period.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Freelance Consultant",
      company: "Chen Consulting LLC",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content: "As a freelancer, I needed a simple way to generate paystubs for my rental applications and bank loans. PaystubPro makes it incredibly easy and the documents are always accepted.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "HR Manager",
      company: "TechStart Inc.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      content: "We switched from manual calculations to PaystubPro and haven't looked back. The multi-state compliance feature is perfect for our remote team across 8 different states.",
      rating: 5,
    },
    {
      name: "David Thompson",
      role: "Household Employer",
      company: "Private Household",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      content: "Creating paystubs for our nanny and housekeeper used to be confusing. PaystubPro handles all the tax calculations automatically. Highly recommend for household employers!",
      rating: 5,
    },
    {
      name: "Lisa Martinez",
      role: "Restaurant Owner",
      company: "Casa Martinez",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      content: "The overtime calculations and tip tracking features are exactly what I needed for my restaurant staff. Professional quality paystubs that my employees love.",
      rating: 5,
    },
    {
      name: "Robert Kim",
      role: "Contractor",
      company: "Kim Construction",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      content: "I use PaystubPro for all my subcontractors. The ability to save profiles and duplicate paystubs makes weekly payroll a breeze. Worth every penny!",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
            Trusted by{" "}
            <span className="text-gradient-primary">50,000+ Businesses</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See what our customers have to say about PaystubPro
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="relative p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-shadow"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground mb-6 relative z-10 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                />
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-primary">{testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: "50,000+", label: "Businesses Served" },
            { value: "1M+", label: "Paystubs Generated" },
            { value: "50", label: "States Covered" },
            { value: "4.9/5", label: "Customer Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-gradient-primary">
                {stat.value}
              </div>
              <div className="text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
