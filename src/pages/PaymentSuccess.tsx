import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Download, Home, FileText } from "lucide-react";

const PaymentSuccess = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6 text-center">
        <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-accent" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your paystub is ready to download.
          </p>
        </div>

        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-left">
              <FileText className="w-5 h-5 text-accent shrink-0" />
              <div>
                <p className="font-medium text-foreground">Your paystub has been generated</p>
                <p className="text-sm text-muted-foreground">
                  Head to the creator to download it in PDF, PNG, or Excel format.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/create?payment=success">
              <Download className="w-4 h-4" />
              Download Paystub
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/dashboard">
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          A confirmation has been sent to your email. If you have any issues, please{" "}
          <Link to="/contact" className="text-primary underline">contact support</Link>.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
