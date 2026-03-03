import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, History, Settings, LogOut, CreditCard, Users, Loader2, Eye, Download, Lock, User, Bell, DollarSign, CheckCircle, XCircle, Clock, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { loadPaystubFromDb } from "@/lib/paystub-db";
import { svgToPng } from "@/lib/svg-to-png";

const PRO_PRICE_ID = "price_1T6P0BGf3K1hj4vvDSuYmNEv";

interface PaystubRecord {
  id: string;
  pay_date: string;
  gross_pay: number | null;
  net_pay: number | null;
  status: string | null;
  is_watermarked: boolean | null;
  created_at: string;
}

interface TransactionRecord {
  id: string;
  amount: number;
  currency: string | null;
  status: string | null;
  description: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading, signOut, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<{ subscribed: boolean; subscription_end?: string } | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paystubs, setPaystubs] = useState<PaystubRecord[]>([]);
  const [loadingPaystubs, setLoadingPaystubs] = useState(true);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Profile editing
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscription(data);
    } catch {
      setSubscription({ subscribed: false });
    }
  }, []);

  const fetchPaystubs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("paystubs")
        .select("id, pay_date, gross_pay, net_pay, status, is_watermarked, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setPaystubs(data || []);
    } catch {
      setPaystubs([]);
    } finally {
      setLoadingPaystubs(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user!.id)
      .single();
    if (data) setFullName(data.full_name || "");
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, currency, status, description, stripe_payment_intent_id, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setTransactions(data || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
    if (user) {
      checkSubscription();
      fetchPaystubs();
      fetchProfile();
      fetchTransactions();
    }
  }, [user, loading, navigate, checkSubscription, fetchPaystubs, fetchProfile, fetchTransactions]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast({ title: "Payment successful!", description: "Your Pro subscription is now active." });
      checkSubscription();
    } else if (checkout === "canceled") {
      toast({ title: "Checkout canceled", variant: "destructive" });
    }
  }, [searchParams, checkSubscription]);

  const handleUpgrade = async () => {
    setCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PRO_PRICE_ID },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    } finally {
      setCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Could not open billing portal", description: err.message, variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", user!.id);
    setSavingProfile(false);
    if (error) {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      setProfileDialogOpen(false);
    }
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    const { error } = await resetPassword(user!.email!);
    setChangingPassword(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password reset email sent", description: "Check your inbox for the reset link." });
      setPasswordDialogOpen(false);
    }
  };

  const handleDownloadPaystub = async (paystubId: string, format: "pdf" | "png" = "pdf") => {
    setDownloadingId(paystubId);
    try {
      const paystubData = await loadPaystubFromDb(paystubId);
      if (!paystubData) throw new Error("Could not load paystub data");

      const { data: funcData, error } = await supabase.functions.invoke("generate-paystub", {
        body: { ...paystubData, format: format === "png" ? "png" : "pdf", watermark: false },
        headers: { "Content-Type": "application/json" },
      });
      if (error) throw error;

      let blob: Blob;
      const fileName = `paystub_${paystubData.employee.firstName}_${paystubData.employee.lastName}`;

      if (format === "png") {
        let svgText: string;
        if (funcData instanceof Blob) svgText = await funcData.text();
        else if (typeof funcData === "string") svgText = funcData;
        else throw new Error("Unexpected SVG response");
        blob = await svgToPng(svgText);
      } else {
        if (funcData instanceof Blob) blob = funcData;
        else if (funcData instanceof ArrayBuffer) blob = new Blob([funcData], { type: "application/pdf" });
        else throw new Error("Unexpected response");
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: `${format.toUpperCase()} Downloaded!` });
    } catch (err) {
      console.error(err);
      toast({ title: "Download failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const formatCurrency = (amount: number | null) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isPro = subscription?.subscribed === true;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                PayStub<span className="text-primary">Wizard</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Manage your paystubs and account settings.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link to="/create">
            <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer group h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Create New Paystub</CardTitle>
                <CardDescription>
                  Generate a professional paystub in under 60 seconds
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Paystub History */}
          <Card className="border-border md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
                    <History className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">Paystub History</CardTitle>
                  <CardDescription>
                    View, edit, and download your previously generated paystubs
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPaystubs ? (
                <Skeleton className="h-16 w-full" />
              ) : paystubs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No paystubs yet. <Link to="/create" className="text-primary underline">Create one now</Link></p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {paystubs.map((ps) => {
                    const isPaid = ps.status === "completed" || ps.status === "downloaded";
                    return (
                      <div key={ps.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {new Date(ps.pay_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{formatCurrency(ps.net_pay)} net</span>
                              <Badge
                                variant={isPaid ? "default" : "secondary"}
                                className="text-xs capitalize"
                              >
                                {ps.status || "draft"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/create?edit=${ps.id}`)}
                            title="Edit paystub"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {isPaid && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPaystub(ps.id, "pdf")}
                                disabled={downloadingId === ps.id}
                                title="Download PDF"
                              >
                                {downloadingId === ps.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPaystub(ps.id, "png")}
                                disabled={downloadingId === ps.id}
                                title="Download PNG"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card className="border-border mb-8">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Payment History</CardTitle>
            <CardDescription>Your past transactions and payment status</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <Skeleton className="h-24 w-full" />
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {transactions.map((tx) => {
                  const statusIcon =
                    tx.status === "succeeded" || tx.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-accent" />
                    ) : tx.status === "pending" ? (
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    );

                  const statusVariant: "default" | "secondary" | "destructive" | "outline" =
                    tx.status === "succeeded" || tx.status === "completed"
                      ? "default"
                      : tx.status === "pending"
                        ? "secondary"
                        : "destructive";

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        {statusIcon}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {tx.description || "Paystub Purchase"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={statusVariant} className="capitalize text-xs">
                          {tx.status || "unknown"}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription & Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Subscription
                  </CardTitle>
                  <CardDescription>Manage your plan and billing</CardDescription>
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${isPro ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {isPro ? "Pro Plan" : "Free Plan"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly limit</span>
                  <span className="font-medium">{isPro ? "Unlimited" : "1 paystub"}</span>
                </div>
                {isPro && subscription?.subscription_end && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Renews on</span>
                    <span className="font-medium">{new Date(subscription.subscription_end).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              {isPro ? (
                <Button variant="outline" className="w-full mt-4" onClick={handleManageSubscription}>
                  Manage Subscription
                </Button>
              ) : (
                <Button
                  className="w-full mt-4 bg-gradient-primary hover:opacity-90"
                  onClick={handleUpgrade}
                  disabled={checkingOut}
                >
                  {checkingOut && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Upgrade to Pro — $29.99/mo
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Update your profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Edit Profile Dialog */}
              <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your account information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user.email || ""} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full bg-gradient-primary hover:opacity-90">
                      {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Change Password Dialog */}
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>We'll send a password reset link to your email</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      A password reset link will be sent to <strong>{user.email}</strong>.
                    </p>
                    <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full bg-gradient-primary hover:opacity-90">
                      {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Send Reset Link
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: "Coming soon", description: "Notification preferences will be available soon." })}>
                <Bell className="w-4 h-4 mr-2" />
                Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
