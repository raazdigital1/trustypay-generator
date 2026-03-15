import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MousePointerClick, Eye, TrendingUp, ExternalLink, RefreshCw, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchConsoleData {
  rows?: SearchRow[];
  responseAggregationType?: string;
}

const DATE_RANGES = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 28 days", value: "28" },
  { label: "Last 3 months", value: "90" },
];

const AdminSearchConsole = () => {
  const { toast } = useToast();
  const [siteUrl, setSiteUrl] = useState("");
  const [dateRange, setDateRange] = useState("28");
  const [queriesData, setQueriesData] = useState<SearchConsoleData | null>(null);
  const [pagesData, setPagesData] = useState<SearchConsoleData | null>(null);
  const [dateData, setDateData] = useState<SearchConsoleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);

  const getDateRange = useCallback(() => {
    const end = new Date();
    end.setDate(end.getDate() - 3); // GSC data has ~3 day delay
    const start = new Date(end);
    start.setDate(start.getDate() - parseInt(dateRange));
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [dateRange]);

  const fetchData = useCallback(async () => {
    if (!siteUrl) return;
    setLoading(true);

    const { startDate, endDate } = getDateRange();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const headers = {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/search-console`;

    try {
      const [queriesRes, pagesRes, dateRes] = await Promise.all([
        fetch(baseUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ siteUrl, startDate, endDate, dimensions: ["query"], rowLimit: 20 }),
        }),
        fetch(baseUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ siteUrl, startDate, endDate, dimensions: ["page"], rowLimit: 20 }),
        }),
        fetch(baseUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ siteUrl, startDate, endDate, dimensions: ["date"], rowLimit: 90 }),
        }),
      ]);

      const [queries, pages, dates] = await Promise.all([
        queriesRes.json(),
        pagesRes.json(),
        dateRes.json(),
      ]);

      if (!queriesRes.ok) throw new Error(queries.error || "Failed to fetch data");

      setQueriesData(queries);
      setPagesData(pages);
      setDateData(dates);
      setConfigured(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error fetching Search Console data", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [siteUrl, getDateRange, toast]);

  // Compute totals from date-level data
  const totals = dateData?.rows?.reduce(
    (acc, row) => ({
      clicks: acc.clicks + row.clicks,
      impressions: acc.impressions + row.impressions,
    }),
    { clicks: 0, impressions: 0 }
  ) || { clicks: 0, impressions: 0 };

  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgPosition =
    dateData?.rows && dateData.rows.length > 0
      ? dateData.rows.reduce((sum, r) => sum + r.position, 0) / dateData.rows.length
      : 0;

  if (!configured && !loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Connect Google Search Console
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your site URL exactly as it appears in Google Search Console (e.g.,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">https://trustypay-generator.lovable.app</code> or{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">sc-domain:trustypay-generator.lovable.app</code>).
            </p>
            <div className="flex gap-3">
              <Input
                placeholder="https://your-site.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="max-w-md"
              />
              <Button onClick={fetchData} disabled={!siteUrl || loading}>
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Connect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          className="max-w-xs"
          placeholder="Site URL"
        />
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={fetchData} disabled={loading} size="sm">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={MousePointerClick} label="Total Clicks" value={totals.clicks.toLocaleString()} color="text-blue-500" />
          <KpiCard icon={Eye} label="Total Impressions" value={totals.impressions.toLocaleString()} color="text-purple-500" />
          <KpiCard icon={TrendingUp} label="Avg CTR" value={`${avgCtr.toFixed(2)}%`} color="text-green-500" />
          <KpiCard icon={Search} label="Avg Position" value={avgPosition.toFixed(1)} color="text-orange-500" />
        </div>
      )}

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Queries</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Impr</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Pos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queriesData?.rows?.length ? (
                    queriesData.rows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium max-w-[200px] truncate">{row.keys[0]}</TableCell>
                        <TableCell className="text-right">{row.clicks}</TableCell>
                        <TableCell className="text-right">{row.impressions}</TableCell>
                        <TableCell className="text-right">{(row.ctr * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{row.position.toFixed(1)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Impr</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagesData?.rows?.length ? (
                    pagesData.rows.map((row, i) => {
                      const url = row.keys[0];
                      const path = new URL(url).pathname;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                              {path || "/"} <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </TableCell>
                          <TableCell className="text-right">{row.clicks}</TableCell>
                          <TableCell className="text-right">{row.impressions}</TableCell>
                          <TableCell className="text-right">{(row.ctr * 100).toFixed(1)}%</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const KpiCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-muted ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AdminSearchConsole;
