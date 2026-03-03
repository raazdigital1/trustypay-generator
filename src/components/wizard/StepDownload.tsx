import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Image, FileSpreadsheet, CheckCircle, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { PaystubData } from "@/types/paystub";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";

interface StepDownloadProps {
  data: PaystubData;
}

const StepDownload = ({ data }: StepDownloadProps) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isPaying, setIsPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Check if returning from successful payment
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setIsPaid(true);
    }
  }, [searchParams]);

  const handlePayAndDownload = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in or create an account to purchase a paystub.",
        variant: "destructive",
      });
      return;
    }

    setIsPaying(true);
    try {
      const { data: funcData, error } = await supabase.functions.invoke("create-payment", {
        body: {},
      });

      if (error) throw error;
      if (funcData?.url) {
        window.location.href = funcData.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast({
        title: "Payment Failed",
        description: "There was an error starting the payment process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleDownload = async (format: "pdf" | "png" | "xlsx") => {
    setIsDownloading(format);
    try {
      if (format === "pdf" || format === "png") {
        const { data: funcData, error } = await supabase.functions.invoke("generate-paystub", {
          body: { ...data, format },
          headers: { "Content-Type": "application/json" },
        });

        if (error) throw error;

        let blob: Blob;
        const mimeType = format === "pdf" ? "application/pdf" : "image/png";
        if (funcData instanceof Blob) {
          blob = funcData;
        } else if (funcData instanceof ArrayBuffer) {
          blob = new Blob([funcData], { type: mimeType });
        } else {
          throw new Error("Unexpected response format");
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `paystub_${data.employee.firstName}_${data.employee.lastName}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: `${format.toUpperCase()} Downloaded!`,
          description: "Your paystub has been downloaded successfully.",
        });
      } else {
        toast({
          title: `${format.toUpperCase()} format`,
          description: "This format will be available soon!",
        });
      }
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Download Failed",
        description: "There was an error generating your paystub. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Download Your Paystub
        </h2>
        <p className="text-muted-foreground">
          {isPaid
            ? "Your payment is confirmed — download your paystub below"
            : "Complete payment to download your professional paystub"}
        </p>
      </div>

      {!isPaid ? (
        <PaymentSection
          isPaying={isPaying}
          isAuthenticated={!!user}
          onPay={handlePayAndDownload}
        />
      ) : (
        <DownloadSection
          isDownloading={isDownloading}
          onDownload={handleDownload}
        />
      )}

      {/* What's Included */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">What's Included</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
              <span>Professional formatting accepted by banks</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
              <span>Accurate federal and state tax calculations</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
              <span>Year-to-date totals included</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
              <span>Compliant with all 50 US states</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ---------- Payment Section ---------- */
interface PaymentSectionProps {
  isPaying: boolean;
  isAuthenticated: boolean;
  onPay: () => void;
}

const PaymentSection = ({ isPaying, isAuthenticated, onPay }: PaymentSectionProps) => (
  <div className="space-y-6">
    <Card className="border-primary/50 shadow-elegant">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-2xl">One-Time Payment</CardTitle>
        <CardDescription>
          Pay once and download your paystub instantly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center bg-muted/50 rounded-lg p-6">
          <div className="text-4xl font-bold text-foreground mb-1">$4.99</div>
          <p className="text-sm text-muted-foreground">per paystub</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>Watermark-free professional PDF</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>High-quality PNG image</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>Excel spreadsheet for records</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>Instant download — no subscription required</span>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground text-center">
              Please <a href="/login" className="text-primary underline">log in</a> or{" "}
              <a href="/signup" className="text-primary underline">create an account</a> to purchase.
            </p>
          )}

          <Button
            className="w-full bg-gradient-primary hover:opacity-90 text-lg h-12"
            onClick={onPay}
            disabled={isPaying || !isAuthenticated}
          >
            {isPaying ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to checkout...
              </span>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay $4.99 & Download
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure payment powered by Stripe</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              <Badge className="bg-accent text-accent-foreground">
                Save 80%
              </Badge>
              Pro Plan — $29.99/month
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Unlimited paystubs, all templates, priority support
            </p>
          </div>
          <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            Upgrade to Pro
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

/* ---------- Download Section (after payment) ---------- */
interface DownloadSectionProps {
  isDownloading: string | null;
  onDownload: (format: "pdf" | "png" | "xlsx") => void;
}

const DownloadSection = ({ isDownloading, onDownload }: DownloadSectionProps) => (
  <div className="space-y-6">
    <Card className="border-accent bg-accent/5">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Payment Successful!</p>
            <p className="text-sm text-muted-foreground">
              Your account has been created. Choose your download format below.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-2 hover:border-primary/50 transition-colors">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-2">
            <FileText className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-lg">PDF Document</CardTitle>
          <CardDescription>Professional format for printing</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => onDownload("pdf")}
            disabled={isDownloading !== null}
          >
            {isDownloading === "pdf" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 hover:border-primary/50 transition-colors">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
            <Image className="w-6 h-6 text-accent" />
          </div>
          <CardTitle className="text-lg">PNG Image</CardTitle>
          <CardDescription>High-quality image format</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => onDownload("png")}
            disabled={isDownloading !== null}
          >
            {isDownloading === "png" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 hover:border-primary/50 transition-colors">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Excel File</CardTitle>
          <CardDescription>Spreadsheet for records</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => onDownload("xlsx")}
            disabled={isDownloading !== null}
          >
            {isDownloading === "xlsx" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Excel
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default StepDownload;
