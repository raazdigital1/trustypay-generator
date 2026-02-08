import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, RefreshCw } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  role?: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profErr) throw profErr;

      const { data: roles, error: roleErr } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (roleErr) throw roleErr;

      const roleMap: Record<string, string> = {};
      roles?.forEach((r) => {
        roleMap[r.user_id] = r.role;
      });

      const enriched = (profiles || []).map((p) => ({
        ...p,
        role: roleMap[p.user_id] || "user",
      }));

      setUsers(enriched);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    try {
      // Check if role exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);
      } else {
        await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole }]);
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      console.error("Role update error:", err);
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const roleBadgeVariant = (role: string) => {
    if (role === "admin") return "destructive" as const;
    if (role === "moderator") return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              User Management
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || "—"}
                      </TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(user.role || "user")}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(val) => handleRoleChange(user.user_id, val as "admin" | "moderator" | "user")}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No users found
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

export default AdminUsers;
