import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calculator, RefreshCw, Save, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TaxRate {
  id: string;
  state_code: string;
  state_name: string;
  federal_rate: number | null;
  state_rate: number | null;
  social_security_rate: number | null;
  medicare_rate: number | null;
  has_state_tax: boolean | null;
}

const AdminTaxRates = () => {
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editedRates, setEditedRates] = useState<Record<string, Partial<TaxRate>>>({});
  const [saving, setSaving] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tax_rates")
        .select("*")
        .order("state_name");
      if (error) throw error;
      setRates(data || []);
      setEditedRates({});
    } catch (err) {
      console.error("Fetch tax rates error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleEdit = (id: string, field: string, value: string) => {
    setEditedRates((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: parseFloat(value) || 0 },
    }));
  };

  const handleSaveAll = async () => {
    const ids = Object.keys(editedRates);
    if (ids.length === 0) return;

    setSaving(true);
    try {
      for (const id of ids) {
        const { error } = await supabase
          .from("tax_rates")
          .update(editedRates[id])
          .eq("id", id);
        if (error) throw error;
      }
      toast({ title: `${ids.length} tax rate(s) updated` });
      fetchRates();
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getRate = (rate: TaxRate, field: keyof TaxRate) => {
    if (editedRates[rate.id] && field in editedRates[rate.id]) {
      return editedRates[rate.id][field] as number;
    }
    return rate[field] as number;
  };

  const formatPercent = (val: number | null) =>
    val != null ? (val * 100).toFixed(2) : "0.00";

  const filtered = rates.filter(
    (r) =>
      r.state_name.toLowerCase().includes(search.toLowerCase()) ||
      r.state_code.toLowerCase().includes(search.toLowerCase())
  );

  const hasEdits = Object.keys(editedRates).length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Tax Rate Management
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchRates}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              {hasEdits && (
                <Button size="sm" onClick={handleSaveAll} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : `Save ${Object.keys(editedRates).length} Change(s)`}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search states..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tax rates...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Federal Rate (%)</TableHead>
                    <TableHead>State Rate (%)</TableHead>
                    <TableHead>Social Security (%)</TableHead>
                    <TableHead>Medicare (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((rate) => (
                    <TableRow
                      key={rate.id}
                      className={editedRates[rate.id] ? "bg-primary/5" : ""}
                    >
                      <TableCell className="font-medium">{rate.state_name}</TableCell>
                      <TableCell>{rate.state_code}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24"
                          value={formatPercent(getRate(rate, "federal_rate"))}
                          onChange={(e) =>
                            handleEdit(rate.id, "federal_rate", String(parseFloat(e.target.value) / 100))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24"
                          value={formatPercent(getRate(rate, "state_rate"))}
                          onChange={(e) =>
                            handleEdit(rate.id, "state_rate", String(parseFloat(e.target.value) / 100))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24"
                          value={formatPercent(getRate(rate, "social_security_rate"))}
                          onChange={(e) =>
                            handleEdit(rate.id, "social_security_rate", String(parseFloat(e.target.value) / 100))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24"
                          value={formatPercent(getRate(rate, "medicare_rate"))}
                          onChange={(e) =>
                            handleEdit(rate.id, "medicare_rate", String(parseFloat(e.target.value) / 100))
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No tax rates found
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

export default AdminTaxRates;
