import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Receipt, CreditCard, DollarSign, TrendingUp, FileText, Tag, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalUsers: number;
  totalPaystubs: number;
  totalTransactions: number;
  totalRevenue: number;
  recentPaystubs: number;
  recentUsers: number;
}

interface CouponStat {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  current_uses: number;
  max_uses: number | null;
  is_active: boolean;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPaystubs: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    recentPaystubs: 0,
    recentUsers: 0,
  });
  const [couponStats, setCouponStats] = useState<CouponStat[]>([]);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [totalRedemptions, setTotalRedemptions] = useState(0);
  const [estimatedDiscount, setEstimatedDiscount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [profilesRes, paystubsRes, transactionsRes, recentPaystubsRes, recentUsersRes, couponsRes] =
          await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("paystubs").select("id", { count: "exact", head: true }),
            supabase.from("transactions").select("amount"),
            supabase
              .from("paystubs")
              .select("id", { count: "exact", head: true })
              .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
            supabase
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
            supabase
              .from("coupons")
              .select("id, code, discount_type, discount_value, current_uses, max_uses, is_active")
              .order("current_uses", { ascending: false }),
          ]);

        const totalRevenue =
          transactionsRes.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

        setStats({
          totalUsers: profilesRes.count || 0,
          totalPaystubs: paystubsRes.count || 0,
          totalTransactions: transactionsRes.data?.length || 0,
          totalRevenue,
          recentPaystubs: recentPaystubsRes.count || 0,
          recentUsers: recentUsersRes.count || 0,
        });

        const coupons = (couponsRes.data || []) as CouponStat[];
        setCouponStats(coupons);
        setTotalCoupons(coupons.length);

        const redemptions = coupons.reduce((sum, c) => sum + c.current_uses, 0);
        setTotalRedemptions(redemptions);

        // Estimate revenue impact: per-use price is $4.99
        const pricePerStub = 4.99;
        const discount = coupons.reduce((sum, c) => {
          if (c.current_uses === 0) return sum;
          const perUse = c.discount_type === "percentage"
            ? pricePerStub * (c.discount_value / 100)
            : Math.min(c.discount_value, pricePerStub);
          return sum + perUse * c.current_uses;
        }, 0);
        setEstimatedDiscount(discount);
      } catch (err) {
        console.error("Stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtitle: `+${stats.recentUsers} this week`,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Total Paystubs",
      value: stats.totalPaystubs,
      subtitle: `+${stats.recentPaystubs} this week`,
      icon: Receipt,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Transactions",
      value: stats.totalTransactions,
      subtitle: "All time",
      icon: CreditCard,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      subtitle: "Total earned",
      icon: DollarSign,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const topCoupons = couponStats.filter((c) => c.current_uses > 0).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coupon Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Coupon Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{totalCoupons}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Coupons</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{totalRedemptions}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Redemptions</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-destructive">${estimatedDiscount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Est. Revenue Impact</p>
            </div>
          </div>

          {topCoupons.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Top Coupons by Usage
              </h4>
              <div className="space-y-2">
                {topCoupons.map((coupon) => {
                  const maxBar = topCoupons[0].current_uses;
                  const width = maxBar > 0 ? (coupon.current_uses / maxBar) * 100 : 0;
                  return (
                    <div key={coupon.id} className="flex items-center gap-3">
                      <code className="text-xs font-mono w-28 truncate text-foreground">{coupon.code}</code>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all"
                          style={{ width: `${width}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                          {coupon.current_uses} uses
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                      </Badge>
                      <Badge variant={coupon.is_active ? "default" : "outline"} className="text-xs shrink-0">
                        {coupon.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No coupon redemptions yet. Create coupons in the Coupons tab.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the sidebar to navigate between Users, Paystubs, Blog Posts, Tax Rates, Transactions, Coupons, and Audit Logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
