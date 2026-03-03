import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Home, FileText, Loader2, AlertTriangle, Image, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { loadPaystubFromDb } from "@/lib/paystub-db";
import { svgToPng } from "@/lib/svg-to-png";
import { toast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get("session_id");
  const paystubIdParam = searchParams.get("paystub_id");

  const [status, setStatus] = useState<"loading" | "verified" | "failed">("loading");
  const [paystubId, setPaystubId] = useState<string | null>(paystubIdParam);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
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
          setPaymentInfo({ amount_total: data.amount_total, currency: data.currency });
          if (data.paystub_id) setPaystubId(data.paystub_id);
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    };

    verify();
  }, [sessionId, user]);

  const handleDownload = async (format: "pdf" | "png" | "xlsx") => {
    if (!paystubId) {
      toast({ title: "No paystub found", description: "Please download from your dashboard.", variant: "destructive" });
      return;
    }

    setIsDownloading(format);
    try {
      const paystubData = await loadPaystubFromDb(paystubId);
      if (!paystubData) throw new Error("Could not load paystub data");

      if (format === "pdf") {
        const { data: funcData, error } = await supabase.functions.invoke("generate-paystub", {
          body: { ...paystubData, format: "pdf", watermark: false },
          headers: { "Content-Type": "application/json" },
        });
        if (error) throw error;

        let blob: Blob;
        if (funcData instanceof Blob) blob = funcData;
        else if (funcData instanceof ArrayBuffer) blob = new Blob([funcData], { type: "application/pdf" });
        else throw new Error("Unexpected response format");

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `paystub_${paystubData.employee.firstName}_${paystubData.employee.lastName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "PDF Downloaded!" });
      } else if (format === "png") {
        const { data: funcData, error } = await supabase.functions.invoke("generate-paystub", {
          body: { ...paystubData, format: "png", watermark: false },
          headers: { "Content-Type": "application/json" },
        });
        if (error) throw error;

        let svgText: string;
        if (funcData instanceof Blob) svgText = await funcData.text();
        else if (typeof funcData === "string") svgText = funcData;
        else throw new Error("Unexpected SVG response");

        const pngBlob = await svgToPng(svgText);
        const url = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `paystub_${paystubData.employee.firstName}_${paystubData.employee.lastName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "PNG Downloaded!" });
      } else {
        toast({ title: "Coming soon", description: "Excel format will be available soon!" });
      }
    } catch (err) {
      console.error("Download error:", err);
      toast({ title: "Download Failed", description: "Please try downloading from your dashboard.", variant: "destructive" });
    } finally {
      setIsDownloading(null);
    }
  };

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
              <Link to="/create"><FileText className="w-4 h-4" />Try Again</Link>
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
      <div className="max-w-2xl w-full space-y-6 text-center">
        <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-accent" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your payment of {formattedAmount} has been confirmed. Download your paystub below.
          </p>
        </div>

        {/* Download Buttons */}
        {paystubId && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { format: "pdf" as const, label: "PDF", icon: FileText, color: "destructive" },
              { format: "png" as const, label: "PNG", icon: Image, color: "accent" },
              { format: "xlsx" as const, label: "Excel", icon: FileSpreadsheet, color: "primary" },
            ]).map(({ format, label, icon: Icon, color }) => (
              <Card key={format} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="text-center pb-2 pt-4">
                  <div className={`mx-auto w-10 h-10 bg-${color}/10 rounded-lg flex items-center justify-center mb-1`}>
                    <Icon className={`w-5 h-5 text-${color}`} />
                  </div>
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleDownload(format)}
                    disabled={isDownloading !== null}
                  >
                    {isDownloading === format ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Download className="w-4 h-4 mr-1" />{label}</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/dashboard">
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="gap-2">
            <Link to="/create">
              <FileText className="w-4 h-4" />
              Create Another
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Your paystub is also available in your{" "}
          <Link to="/dashboard" className="text-primary underline">dashboard</Link>.
          If you have any issues, please{" "}
          <Link to="/contact" className="text-primary underline">contact support</Link>.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
