import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p className="text-lg">
              Last updated: February 5, 2026
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, including when you create an account,
                generate paystubs, make purchases, or contact us for support. This may include:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Name and email address</li>
                <li>Company information for paystub generation</li>
                <li>Employee details (stored temporarily)</li>
                <li>Payment information (processed securely via Stripe)</li>
                <li>Usage data and preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Data Retention</h2>
              <p>
                We take your privacy seriously. Sensitive employee data entered for paystub generation
                is automatically deleted after 48 hours. Your account information and generated paystub
                metadata are retained for as long as you maintain an active account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Detect and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Information Sharing</h2>
              <p>
                We do not sell your personal information. We may share information with third-party
                service providers who perform services on our behalf, such as payment processing and
                hosting. These providers are contractually obligated to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Security</h2>
              <p>
                We implement industry-standard security measures including encryption in transit (SSL/TLS)
                and at rest. All payment processing is handled by PCI-compliant payment processors.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal information. You can
                manage your account settings or contact us to exercise these rights. California
                residents have additional rights under the CCPA.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:{" "}
                <a href="mailto:privacy@paystubpro.com" className="text-primary hover:underline">
                  privacy@paystubpro.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
