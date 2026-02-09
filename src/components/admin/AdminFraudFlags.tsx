import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, RefreshCw, Search, CheckCircle, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FraudFlag {
  id: string;
  user_id: string;
  reason: string;
  severity: string | null;
  is_resolved: boolean | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  userEmail?: string;
}

const AdminFraudFlags = () => {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("unresolved");
  const [selectedFlag, setSelectedFlag] = useState<FraudFlag | null>(null);
  const [resolving, setResolving] = useState(false);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("fraud_flags")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filter === "unresolved") {
        query = query.eq("is_resolved", false);
      } else if (filter === "resolved") {
        query = query.eq("is_resolved", true);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with user emails from profiles
      const userIds = [...new Set((data || []).map((f) => f.user_id))];
      let emailMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", userIds);

        if (profiles) {
          profiles.forEach((p) => {
            if (p.email) emailMap[p.user_id] = p.email;
          });
        }
      }

      setFlags(
        (data || []).map((f) => ({
          ...f,
          userEmail: emailMap[f.user_id] || f.user_id.slice(0, 8) + "...",
        }))
      );
    } catch (err) {
      console.error("Fetch fraud flags error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [filter]);

  const handleResolve = async () => {
    if (!selectedFlag || !user) return;
    setResolving(true);
    try {
      const { error } = await supabase
        .from("fraud_flags")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq("id", selectedFlag.id);

      if (error) throw error;

      toast({ title: "Flag resolved" });
      setSelectedFlag(null);
      fetchFlags();
    } catch (err) {
      console.error("Resolve error:", err);
      toast({ title: "Failed to resolve flag", variant: "destructive" });
    } finally {
      setResolving(false);
    }
  };

  const severityBadge = (severity: string | null) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge className="bg-warning/15 text-warning border-warning/30">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{severity || "Unknown"}</Badge>;
    }
  };

  const filtered = flags.filter(
    (f) =>
      f.reason.toLowerCase().includes(search.toLowerCase()) ||
      (f.userEmail || "").toLowerCase().includes(search.toLowerCase())
  );

  const unresolvedCount = flags.filter((f) => !f.is_resolved).length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{unresolvedCount}</p>
              <p className="text-xs text-muted-foreground">Unresolved Flags</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {flags.filter((f) => f.is_resolved).length}
              </p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{flags.length}</p>
              <p className="text-xs text-muted-foreground">Total Flags</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flags Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Fraud Flags
            </CardTitle>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchFlags}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by reason or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading fraud flags...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell className="text-sm">
                        {new Date(flag.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {flag.userEmail}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm">
                        {flag.reason}
                      </TableCell>
                      <TableCell>{severityBadge(flag.severity)}</TableCell>
                      <TableCell>
                        {flag.is_resolved ? (
                          <Badge variant="outline" className="text-accent border-accent/30">
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Open</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFlag(flag)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No fraud flags found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail / Resolve Dialog */}
      <Dialog open={!!selectedFlag} onOpenChange={(open) => !open && setSelectedFlag(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Fraud Flag Details
            </DialogTitle>
            <DialogDescription>Review the flagged activity and take action.</DialogDescription>
          </DialogHeader>

          {selectedFlag && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">User</p>
                  <p className="font-medium">{selectedFlag.userEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Severity</p>
                  {severityBadge(selectedFlag.severity)}
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Flagged On</p>
                  <p className="font-medium">
                    {new Date(selectedFlag.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  {selectedFlag.is_resolved ? (
                    <Badge variant="outline" className="text-accent border-accent/30">
                      Resolved {selectedFlag.resolved_at
                        ? `on ${new Date(selectedFlag.resolved_at).toLocaleDateString()}`
                        : ""}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Open</Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Reason</p>
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  {selectedFlag.reason}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFlag(null)}>
              Close
            </Button>
            {selectedFlag && !selectedFlag.is_resolved && (
              <Button onClick={handleResolve} disabled={resolving}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {resolving ? "Resolving..." : "Mark as Resolved"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFraudFlags;
