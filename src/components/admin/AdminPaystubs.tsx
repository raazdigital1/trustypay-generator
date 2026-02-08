import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, RefreshCw, Search } from "lucide-react";

interface Paystub {
  id: string;
  user_id: string;
  status: string | null;
  template_id: string | null;
  state_code: string | null;
  gross_pay: number | null;
  net_pay: number | null;
  pay_date: string;
  created_at: string;
  is_hourly: boolean | null;
}

const AdminPaystubs = () => {
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPaystubs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("paystubs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setPaystubs(data || []);
    } catch (err) {
      console.error("Fetch paystubs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaystubs();
  }, []);

  const statusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "downloaded":
        return <Badge className="bg-accent text-accent-foreground">Downloaded</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const fmt = (val: number | null) =>
    val != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val)
      : "—";

  const filtered = paystubs.filter(
    (p) =>
      (p.state_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.template_id || "").toLowerCase().includes(search.toLowerCase()) ||
      p.user_id.includes(search)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Paystub Management
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchPaystubs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by state, template, or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading paystubs...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pay Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Gross Pay</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {new Date(p.pay_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{p.is_hourly ? "Hourly" : "Salary"}</TableCell>
                      <TableCell>{p.state_code || "—"}</TableCell>
                      <TableCell>{fmt(p.gross_pay)}</TableCell>
                      <TableCell className="font-medium">{fmt(p.net_pay)}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No paystubs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaystubs;
