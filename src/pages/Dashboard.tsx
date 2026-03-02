import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, History, Settings, LogOut, CreditCard, Users, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PRO_PRICE_ID = "price_1T6P0BGf3K1hj4vvDSuYmNEv";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<{ subscribed: boolean; subscription_end?: string } | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscription(data);
    } catch {
      setSubscription({ subscribed: false });
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
    if (user) {
      checkSubscription();
    }
  }, [user, loading, navigate, checkSubscription]);

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
                Paystub<span className="text-primary">Pro</span>
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

          <Card className="border-border">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
                <History className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-lg">Paystub History</CardTitle>
              <CardDescription>
                View and manage your previously generated paystubs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No paystubs yet</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-warning" />
              </div>
              <CardTitle className="text-lg">Saved Employers</CardTitle>
              <CardDescription>
                Manage your saved employer information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No employers saved</p>
            </CardContent>
          </Card>
        </div>

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
                  Upgrade to Pro — $49.99/mo
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
              <Button variant="outline" className="w-full justify-start">
                Edit Profile
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
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
