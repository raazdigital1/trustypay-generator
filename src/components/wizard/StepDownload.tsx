import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Image, FileSpreadsheet, CheckCircle, CreditCard, ShieldCheck, Loader2, Tag, X, Stamp } from "lucide-react";
import { PaystubData } from "@/types/paystub";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { savePaystubToDb } from "@/lib/paystub-db";

interface StepDownloadProps {
  data: PaystubData;
}

const StepDownload = ({ data }: StepDownloadProps) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isPaying, setIsPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isFreeDownloading, setIsFreeDownloading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

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
      // Save paystub to database first
      const paystubId = await savePaystubToDb(data, user.id);

      const { data: funcData, error } = await supabase.functions.invoke("create-payment", {
        body: { coupon_code: appliedCoupon || undefined, paystub_id: paystubId },
      });

      if (error) throw error;
      if (funcData?.error) {
        setCouponError(funcData.error);
        setAppliedCoupon(null);
        return;
      }
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

  const handleDownload = async (format: "pdf" | "png" | "xlsx", watermark: boolean = false) => {
    if (watermark) {
      setIsFreeDownloading(true);
    } else {
      setIsDownloading(format);
    }
    try {
      if (format === "pdf" || format === "png") {
        const { data: funcData, error } = await supabase.functions.invoke("generate-paystub", {
          body: { ...data, format, watermark },
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

        const suffix = watermark ? "_sample" : "";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `paystub_${data.employee.firstName}_${data.employee.lastName}${suffix}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: watermark ? "Sample Downloaded!" : `${format.toUpperCase()} Downloaded!`,
          description: watermark
            ? "Your watermarked sample paystub has been downloaded."
            : "Your paystub has been downloaded successfully.",
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
      setIsFreeDownloading(false);
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
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          appliedCoupon={appliedCoupon}
          setAppliedCoupon={setAppliedCoupon}
          couponError={couponError}
          setCouponError={setCouponError}
          isFreeDownloading={isFreeDownloading}
          onFreeDownload={() => handleDownload("pdf", true)}
        />
      ) : (
        <DownloadSection
          isDownloading={isDownloading}
          onDownload={(format) => handleDownload(format)}
        />
      )}

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
  couponCode: string;
  setCouponCode: (v: string) => void;
  appliedCoupon: string | null;
  setAppliedCoupon: (v: string | null) => void;
  couponError: string | null;
  setCouponError: (v: string | null) => void;
  isFreeDownloading: boolean;
  onFreeDownload: () => void;
}

const PaymentSection = ({
  isPaying, isAuthenticated, onPay,
  couponCode, setCouponCode, appliedCoupon, setAppliedCoupon, couponError, setCouponError,
  isFreeDownloading, onFreeDownload,
}: PaymentSectionProps) => {
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponError(null);
    setAppliedCoupon(code);
    setCouponCode("");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  return (
  <div className="space-y-6">
    <Card className="border-primary/50 shadow-elegant">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-2xl">One-Time Payment</CardTitle>
        <CardDescription>Pay once and download your paystub instantly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center bg-muted/50 rounded-lg p-6">
          <div className="text-4xl font-bold text-foreground mb-1">$4.99</div>
          <p className="text-sm text-muted-foreground">per paystub</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-accent" /><span>Watermark-free professional PDF</span></div>
          <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-accent" /><span>High-quality PNG image</span></div>
          <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-accent" /><span>Excel spreadsheet for records</span></div>
          <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-accent" /><span>Instant download — no subscription required</span></div>
        </div>

        {/* Coupon Code */}
        <div className="space-y-2">
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-accent/10 border border-accent/30 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">
                  Coupon <code className="font-mono">{appliedCoupon}</code> applied
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveCoupon}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value); setCouponError(null); }}
                className="font-mono uppercase"
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              />
              <Button variant="outline" onClick={handleApplyCoupon} disabled={!couponCode.trim()}>
                Apply
              </Button>
            </div>
          )}
          {couponError && <p className="text-xs text-destructive">{couponError}</p>}
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
                Saving & redirecting...
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
              <Badge className="bg-accent text-accent-foreground">Save 80%</Badge>
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

    {/* Free Watermarked Download */}
    <Card className="border-muted">
      <CardContent className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Stamp className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Free Sample — Watermarked PDF</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Download a preview copy with a "SAMPLE" watermark. No payment required.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onFreeDownload} disabled={isFreeDownloading}>
            {isFreeDownloading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Free Download
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
  );
};

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
            <p className="text-sm text-muted-foreground">Choose your download format below.</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {([
        { format: "pdf" as const, label: "PDF Document", desc: "Professional format for printing", icon: FileText, color: "destructive" },
        { format: "png" as const, label: "PNG Image", desc: "High-quality image format", icon: Image, color: "accent" },
        { format: "xlsx" as const, label: "Excel File", desc: "Spreadsheet for records", icon: FileSpreadsheet, color: "primary" },
      ]).map(({ format, label, desc, icon: Icon, color }) => (
        <Card key={format} className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="text-center pb-2">
            <div className={`mx-auto w-12 h-12 bg-${color}/10 rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-6 h-6 text-${color}`} />
            </div>
            <CardTitle className="text-lg">{label}</CardTitle>
            <CardDescription>{desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => onDownload(format)} disabled={isDownloading !== null}>
              {isDownloading === format ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Generating...</span>
              ) : (
                <><Download className="w-4 h-4 mr-2" />Download {format.toUpperCase()}</>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default StepDownload;
