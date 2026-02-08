import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Receipt, CreditCard, DollarSign, TrendingUp, FileText } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalPaystubs: number;
  totalTransactions: number;
  totalRevenue: number;
  recentPaystubs: number;
  recentUsers: number;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [profilesRes, paystubsRes, transactionsRes, recentPaystubsRes, recentUsersRes] =
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the sidebar to navigate between Users, Paystubs, Blog Posts, Tax Rates, Transactions, and Audit Logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
