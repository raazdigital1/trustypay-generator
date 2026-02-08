import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Shield, RefreshCw } from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, user_id, action, entity_type, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Fetch audit logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionColor = (action: string) => {
    if (action.includes("delete")) return "destructive" as const;
    if (action.includes("create") || action.includes("insert")) return "default" as const;
    if (action.includes("update")) return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Audit Logs
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>User ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionColor(log.action)}>{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.entity_type || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono max-w-[120px] truncate text-muted-foreground">
                        {log.entity_id || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono max-w-[120px] truncate text-muted-foreground">
                        {log.user_id || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No audit logs yet
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

export default AdminAuditLogs;
