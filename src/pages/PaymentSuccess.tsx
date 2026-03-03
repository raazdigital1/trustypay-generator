import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Download, Home, FileText, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"loading" | "verified" | "failed">("loading");
  const [paymentInfo, setPaymentInfo] = useState<{
    amount_total: number | null;
    currency: string | null;
  } | null>(null);

  useEffect(() => {
    if (!sessionId || !user) {
      setStatus(sessionId ? "loading" : "failed");
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { session_id: sessionId },
        });

        if (error) throw error;

        if (data?.verified) {
          setStatus("verified");
          setPaymentInfo({
            amount_total: data.amount_total,
            currency: data.currency,
          });
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    };

    verify();
  }, [sessionId, user]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Verifying your payment…</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-6 text-center">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Payment Not Verified</h1>
            <p className="text-muted-foreground">
              We couldn't verify your payment. If you believe this is an error, please contact support.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/create">
                <FileText className="w-4 h-4" />
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formattedAmount = paymentInfo?.amount_total
    ? `$${(paymentInfo.amount_total / 100).toFixed(2)}`
    : "$4.99";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6 text-center">
        <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-accent" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your payment of {formattedAmount} has been confirmed. Your paystub is ready to download.
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
