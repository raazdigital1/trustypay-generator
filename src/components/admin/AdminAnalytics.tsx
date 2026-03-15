import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, Users, Receipt, DollarSign, TrendingUp, TrendingDown,
  Calendar, ArrowUpRight, ArrowDownRight, Activity,
} from "lucide-react";

interface PeriodStats {
  users: number;
  paystubs: number;
  transactions: number;
  revenue: number;
}

interface DailyData {
  date: string;
  users: number;
  paystubs: number;
  revenue: number;
}

const AdminAnalytics = () => {
  const [currentPeriod, setCurrentPeriod] = useState<PeriodStats>({ users: 0, paystubs: 0, transactions: 0, revenue: 0 });
  const [previousPeriod, setPreviousPeriod] = useState<PeriodStats>({ users: 0, paystubs: 0, transactions: 0, revenue: 0 });
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [topStates, setTopStates] = useState<{ state: string; count: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ action: string; time: string; entity: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const daysMap = { "7d": 7, "30d": 30, "90d": 90 };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const days = daysMap[timeRange];
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 86400000);
    const previousStart = new Date(currentStart.getTime() - days * 86400000);

    try {
      const [
        currentUsersRes, previousUsersRes,
        currentPaystubsRes, previousPaystubsRes,
        currentTxRes, previousTxRes,
        paystubStatesRes, auditRes, dailyUsersRes, dailyPaystubsRes, dailyTxRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", currentStart.toISOString()),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", previousStart.toISOString()).lt("created_at", currentStart.toISOString()),
        supabase.from("paystubs").select("id", { count: "exact", head: true }).gte("created_at", currentStart.toISOString()),
        supabase.from("paystubs").select("id", { count: "exact", head: true }).gte("created_at", previousStart.toISOString()).lt("created_at", currentStart.toISOString()),
        supabase.from("transactions").select("amount").gte("created_at", currentStart.toISOString()),
        supabase.from("transactions").select("amount").gte("created_at", previousStart.toISOString()).lt("created_at", currentStart.toISOString()),
        supabase.from("paystubs").select("state_code").gte("created_at", currentStart.toISOString()),
        supabase.from("audit_logs").select("action, created_at, entity_type").order("created_at", { ascending: false }).limit(10),
        supabase.from("profiles").select("created_at").gte("created_at", currentStart.toISOString()).order("created_at", { ascending: true }),
        supabase.from("paystubs").select("created_at").gte("created_at", currentStart.toISOString()).order("created_at", { ascending: true }),
        supabase.from("transactions").select("amount, created_at").gte("created_at", currentStart.toISOString()).order("created_at", { ascending: true }),
      ]);

      const currentRevenue = currentTxRes.data?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
      const previousRevenue = previousTxRes.data?.reduce((s, t) => s + (t.amount || 0), 0) || 0;

      setCurrentPeriod({
        users: currentUsersRes.count || 0,
        paystubs: currentPaystubsRes.count || 0,
        transactions: currentTxRes.data?.length || 0,
        revenue: currentRevenue,
      });
      setPreviousPeriod({
        users: previousUsersRes.count || 0,
        paystubs: previousPaystubsRes.count || 0,
        transactions: previousTxRes.data?.length || 0,
        revenue: previousRevenue,
      });

      // State breakdown
      const stateCounts: Record<string, number> = {};
      paystubStatesRes.data?.forEach((p) => {
        const st = p.state_code || "Unknown";
        stateCounts[st] = (stateCounts[st] || 0) + 1;
      });
      setTopStates(
        Object.entries(stateCounts)
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      );

      // Recent activity
      setRecentActivity(
        (auditRes.data || []).map((a) => ({
          action: a.action,
          time: new Date(a.created_at).toLocaleString(),
          entity: a.entity_type || "—",
        }))
      );

      // Daily data
      const dailyMap: Record<string, DailyData> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(currentStart.getTime() + i * 86400000);
        const key = d.toISOString().split("T")[0];
        dailyMap[key] = { date: key, users: 0, paystubs: 0, revenue: 0 };
      }
      dailyUsersRes.data?.forEach((u) => {
        const key = u.created_at.split("T")[0];
        if (dailyMap[key]) dailyMap[key].users++;
      });
      dailyPaystubsRes.data?.forEach((p) => {
        const key = p.created_at.split("T")[0];
        if (dailyMap[key]) dailyMap[key].paystubs++;
      });
      dailyTxRes.data?.forEach((t) => {
        const key = t.created_at.split("T")[0];
        if (dailyMap[key]) dailyMap[key].revenue += t.amount || 0;
      });
      setDailyData(Object.values(dailyMap));
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const MetricCard = ({
    title, value, previous, icon: Icon, prefix = "", format,
  }: {
    title: string; value: number; previous: number; icon: React.ElementType; prefix?: string;
    format?: (v: number) => string;
  }) => {
    const change = pctChange(value, previous);
    const isUp = change >= 0;
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <Badge variant={isUp ? "default" : "destructive"} className="text-xs flex items-center gap-1">
              {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change).toFixed(1)}%
            </Badge>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {prefix}{format ? format(value) : value.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
          <p className="text-xs text-muted-foreground">
            vs previous {timeRange === "7d" ? "week" : timeRange === "30d" ? "month" : "quarter"}: {prefix}{format ? format(previous) : previous.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    );
  };

  const maxBarValue = Math.max(...dailyData.map((d) => d.revenue), 1);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Analytics Dashboard</h2>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeRange === range
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* GA4 Integration Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Google Analytics Connected</p>
            <p className="text-xs text-muted-foreground">
              GA4 tracking is active (G-Z17KJQZ8VH). Visit{" "}
              <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Google Analytics
              </a>{" "}
              for detailed visitor insights. The data below is from your internal database.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="New Users" value={currentPeriod.users} previous={previousPeriod.users} icon={Users} />
        <MetricCard title="Paystubs Generated" value={currentPeriod.paystubs} previous={previousPeriod.paystubs} icon={Receipt} />
        <MetricCard title="Transactions" value={currentPeriod.transactions} previous={previousPeriod.transactions} icon={DollarSign} />
        <MetricCard
          title="Revenue"
          value={currentPeriod.revenue}
          previous={previousPeriod.revenue}
          icon={TrendingUp}
          prefix="$"
          format={(v) => v.toFixed(2)}
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Daily Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[2px] h-40">
            {dailyData.map((d) => {
              const height = maxBarValue > 0 ? (d.revenue / maxBarValue) * 100 : 0;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute -top-8 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                    {d.date}: ${d.revenue.toFixed(2)}
                  </div>
                  <div
                    className="w-full bg-primary/70 rounded-t-sm hover:bg-primary transition-colors min-h-[2px]"
                    style={{ height: `${Math.max(height, 1)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{dailyData[0]?.date}</span>
            <span>{dailyData[dailyData.length - 1]?.date}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top States */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top States by Paystubs</CardTitle>
          </CardHeader>
          <CardContent>
            {topStates.length > 0 ? (
              <div className="space-y-2">
                {topStates.map((s, i) => {
                  const maxCount = topStates[0].count;
                  const width = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
                  return (
                    <div key={s.state} className="flex items-center gap-3">
                      <span className="text-xs font-mono w-8 text-muted-foreground">{s.state}</span>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden relative">
                        <div className="h-full bg-accent/70 rounded-full" style={{ width: `${width}%` }} />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                          {s.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data for this period.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{a.action}</p>
                      <p className="text-xs text-muted-foreground">{a.entity} · {a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
