import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-8">Disclaimer</h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p className="text-lg">Last updated: February 5, 2026</p>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Purpose of PayStub Wizard</h2>
              <p>PayStub Wizard is a document generation tool designed to help small businesses, freelancers, and household employers create professional paystub documents. The documents generated are for informational and record-keeping purposes.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Accuracy of Information</h2>
              <p>While we strive to provide accurate tax calculations based on current federal and state rates, PayStub Wizard does not guarantee the accuracy of tax calculations or compliance with specific employer requirements. Users are responsible for verifying all information entered and ensuring accuracy of the final documents.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Not a Substitute for Professional Advice</h2>
              <p>PayStub Wizard is not a payroll service and does not provide tax, legal, or accounting advice. For complex payroll situations, tax questions, or legal matters, we recommend consulting with a qualified professional.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Prohibited Uses</h2>
              <p>PayStub Wizard must not be used for any fraudulent, illegal, or deceptive purposes. This includes but is not limited to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Creating false employment records</li>
                <li>Misrepresenting income for loan applications</li>
                <li>Tax evasion or fraud</li>
                <li>Identity theft or impersonation</li>
                <li>Any other illegal activity</li>
              </ul>
              <p className="mt-4">Misuse of our service may result in immediate account termination and reporting to appropriate authorities.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Limitation of Liability</h2>
              <p>PayStub Wizard and its operators shall not be held liable for any damages, losses, or legal consequences arising from the use or misuse of our service. This includes direct, indirect, incidental, consequential, or punitive damages.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">User Responsibility</h2>
              <p>By using PayStub Wizard, you acknowledge that you are solely responsible for:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>The accuracy of all information entered</li>
                <li>Ensuring appropriate use of generated documents</li>
                <li>Compliance with applicable laws and regulations</li>
                <li>Maintaining proper employment and tax records</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Contact</h2>
              <p>
                If you have questions about this Disclaimer, please contact us at:{" "}
                <a href="mailto:legal@paystubwizard.com" className="text-primary hover:underline">
                  legal@paystubwizard.com
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

export default Disclaimer;