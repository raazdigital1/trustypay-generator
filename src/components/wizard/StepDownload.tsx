import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Image, FileSpreadsheet, Lock, CheckCircle, CreditCard } from "lucide-react";
import { PaystubData } from "@/types/paystub";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface StepDownloadProps {
  data: PaystubData;
}

const StepDownload = ({ data }: StepDownloadProps) => {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  // Mock subscription status - in production, fetch from database
  const isPro = false;
  const canDownload = !!user;

  const handleDownload = async (format: "pdf" | "png" | "xlsx") => {
    if (!canDownload) return;

    setIsDownloading(true);
    // TODO: Implement actual PDF generation via edge function
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsDownloading(false);
    alert(`Download ${format.toUpperCase()} - Coming soon!`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Download Your Paystub
        </h2>
        <p className="text-muted-foreground">
          Choose your preferred format and download
        </p>
      </div>

      {!user ? (
        <Card className="border-primary/50 shadow-elegant mb-8">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Sign in to Download</CardTitle>
            <CardDescription>
              Create a free account to download your paystub
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link to="/signup">
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Create Free Account
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Already have an account? Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Subscription Status */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Current Plan: {isPro ? "Pro" : "Free"}</p>
                    <p className="text-sm text-muted-foreground">
                      {isPro
                        ? "Unlimited paystubs, no watermarks"
                        : "1 watermarked paystub per month"}
                    </p>
                  </div>
                </div>
                {!isPro && (
                  <Button className="bg-gradient-primary hover:opacity-90">
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Download Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* PDF Download */}
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
                  onClick={() => handleDownload("pdf")}
                  disabled={isDownloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            {/* PNG Download */}
            <Card className={`border-2 ${isPro ? "hover:border-primary/50" : "opacity-60"} transition-colors`}>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
                  <Image className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-lg flex items-center justify-center gap-2">
                  PNG Image
                  {!isPro && <Badge variant="secondary">Pro</Badge>}
                </CardTitle>
                <CardDescription>High-quality image format</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant={isPro ? "default" : "secondary"}
                  onClick={() => isPro && handleDownload("png")}
                  disabled={!isPro || isDownloading}
                >
                  {isPro ? (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PNG
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Upgrade Required
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Excel Download */}
            <Card className={`border-2 ${isPro ? "hover:border-primary/50" : "opacity-60"} transition-colors`}>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-2">
                  <FileSpreadsheet className="w-6 h-6 text-success" />
                </div>
                <CardTitle className="text-lg flex items-center justify-center gap-2">
                  Excel File
                  {!isPro && <Badge variant="secondary">Pro</Badge>}
                </CardTitle>
                <CardDescription>Spreadsheet for records</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant={isPro ? "default" : "secondary"}
                  onClick={() => isPro && handleDownload("xlsx")}
                  disabled={!isPro || isDownloading}
                >
                  {isPro ? (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Excel
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Upgrade Required
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Pay Per Stub Option */}
          {!isPro && (
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-warning" />
                      One-Time Purchase: $7.99
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Get a watermark-free PDF + PNG + Excel for this paystub
                    </p>
                  </div>
                  <Button variant="outline" className="border-warning text-warning hover:bg-warning hover:text-warning-foreground">
                    Pay $7.99
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
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

export default StepDownload;
