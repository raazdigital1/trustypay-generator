import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p className="text-lg">
              Last updated: February 5, 2026
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using PaystubPro, you agree to be bound by these Terms of Service.
                If you do not agree to these terms, you may not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Use of Services</h2>
              <p>
                PaystubPro provides tools for generating paystub documents. You agree to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide accurate and truthful information</li>
                <li>Use the service only for lawful purposes</li>
                <li>Not misrepresent the nature or source of income</li>
                <li>Not use generated documents for fraudulent purposes</li>
                <li>Maintain the confidentiality of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. User Responsibilities</h2>
              <p>
                You are solely responsible for the accuracy of information entered into PaystubPro.
                We do not verify the accuracy of employer information, earnings, or deductions.
                Misuse of our service for fraud or deception is strictly prohibited and may be
                reported to authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Payment Terms</h2>
              <p>
                Subscription fees are billed in advance on a monthly basis. One-time purchases
                are non-refundable once the document has been downloaded. We reserve the right
                to change pricing with 30 days notice to existing subscribers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Intellectual Property</h2>
              <p>
                The PaystubPro service, including its design, features, and content, is owned by
                PaystubPro and protected by copyright and trademark laws. You retain ownership
                of the data you input, but grant us license to use it to provide the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Limitation of Liability</h2>
              <p>
                PaystubPro provides document generation tools "as is" without warranties of any kind.
                We are not liable for any damages arising from the use of our service, including
                but not limited to financial losses, legal consequences, or data loss.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Termination</h2>
              <p>
                We may terminate or suspend your account immediately, without prior notice, for
                conduct that we believe violates these Terms or is harmful to other users,
                us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Contact</h2>
              <p>
                For questions about these Terms, contact us at:{" "}
                <a href="mailto:legal@paystubpro.com" className="text-primary hover:underline">
                  legal@paystubpro.com
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

export default Terms;
