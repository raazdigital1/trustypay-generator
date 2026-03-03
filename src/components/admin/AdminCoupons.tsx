import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy, Tag } from "lucide-react";
import { format } from "date-fns";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const empty = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 0,
  max_uses: "",
  expires_at: "",
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load coupons");
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description || "",
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      max_uses: c.max_uses?.toString() || "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error("Code is required"); return; }
    if (form.discount_value <= 0) { toast.error("Discount value must be positive"); return; }
    if (form.discount_type === "percentage" && form.discount_value > 100) {
      toast.error("Percentage cannot exceed 100"); return;
    }

    setSaving(true);
    const payload = {
      code: form.code.toUpperCase().trim(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    if (editing) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editing.id);
      if (error) toast.error("Failed to update coupon");
      else toast.success("Coupon updated");
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) toast.error(error.message.includes("duplicate") ? "Code already exists" : "Failed to create coupon");
      else toast.success("Coupon created");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchCoupons();
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) toast.error("Failed to update");
    else fetchCoupons();
  };

  const deleteCoupon = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", c.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchCoupons(); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Coupons</h2>
          <p className="text-sm text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Coupon
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tag className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No coupons yet. Create your first one!</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-semibold text-foreground">{c.code}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(c.code)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {c.discount_type === "percentage" ? `${c.discount_value}%` : `$${c.discount_value}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.current_uses}{c.max_uses ? ` / ${c.max_uses}` : ""}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.expires_at ? format(new Date(c.expires_at), "MMM d, yyyy") : "Never"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCoupon(c)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the coupon details below." : "Fill in the details to create a new discount coupon."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="SUMMER25"
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label>Expires At</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
