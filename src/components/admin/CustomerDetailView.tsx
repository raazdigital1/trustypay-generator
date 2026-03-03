import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, DollarSign, CheckCircle, Clock, XCircle, User, CreditCard } from "lucide-react";

interface CustomerDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  customerName: string | null;
  customerEmail: string | null;
  planType: string | null;
  status: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

const formatCurrency = (amount: number | null) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount || 0);

const CustomerDetailView = ({
  open,
  onOpenChange,
  userId,
  customerName,
  customerEmail,
  planType,
  status,
  stripeCustomerId,
  stripeSubscriptionId,
}: CustomerDetailViewProps) => {
  const { data: paystubs = [], isLoading: loadingPaystubs } = useQuery({
    queryKey: ["admin-customer-paystubs", userId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paystubs")
        .select("id, pay_date, pay_period_start, pay_period_end, gross_pay, net_pay, total_deductions, status, is_watermarked, template_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["admin-customer-transactions", userId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, currency, status, description, stripe_payment_intent_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const totalSpent = transactions
    .filter((t) => t.status === "succeeded" || t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Customer Details
          </DialogTitle>
        </DialogHeader>

        {/* Customer Info Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-semibold text-foreground">{customerName || "—"}</p>
              <p className="text-xs text-muted-foreground">{customerEmail || "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground">Plan & Status</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">{planType ?? "free"}</Badge>
                <Badge
                  variant="outline"
                  className={
                    status === "active" ? "bg-green-500/10 text-green-700 border-green-200" :
                    status === "cancelled" ? "bg-red-500/10 text-red-700 border-red-200" :
                    ""
                  }
                >
                  {status ?? "unknown"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground">Lifetime Spend</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalSpent)}</p>
              <p className="text-xs text-muted-foreground">{paystubs.length} paystubs · {transactions.length} transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Stripe IDs */}
        {(stripeCustomerId || stripeSubscriptionId) && (
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-2">
            {stripeCustomerId && (
              <span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Stripe Customer: <code className="font-mono">{stripeCustomerId}</code>
              </span>
            )}
            {stripeSubscriptionId && (
              <span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Subscription: <code className="font-mono">{stripeSubscriptionId}</code>
              </span>
            )}
          </div>
        )}

        <Tabs defaultValue="paystubs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paystubs" className="gap-2">
              <FileText className="w-4 h-4" />
              Paystubs ({paystubs.length})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Transactions ({transactions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paystubs">
            {loadingPaystubs ? (
              <Skeleton className="h-32 w-full" />
            ) : paystubs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No paystubs found.</p>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pay Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paystubs.map((ps) => (
                      <TableRow key={ps.id}>
                        <TableCell className="text-sm">
                          {new Date(ps.pay_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(ps.pay_period_start).toLocaleDateString()} – {new Date(ps.pay_period_end).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(ps.gross_pay)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatCurrency(ps.total_deductions)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(ps.net_pay)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              ps.status === "completed" || ps.status === "downloaded"
                                ? "bg-green-500/10 text-green-700 border-green-200"
                                : "bg-yellow-500/10 text-yellow-700 border-yellow-200"
                            }
                          >
                            {ps.status ?? "draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs capitalize text-muted-foreground">
                          {ps.template_id || "classic"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(ps.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions">
            {loadingTransactions ? (
              <Skeleton className="h-32 w-full" />
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No transactions found.</p>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Intent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => {
                      const statusIcon =
                        tx.status === "succeeded" || tx.status === "completed" ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        ) : tx.status === "pending" ? (
                          <Clock className="w-3.5 h-3.5 text-yellow-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-destructive" />
                        );

                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm">
                            {new Date(tx.created_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                              hour: "numeric", minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="text-sm">{tx.description || "Paystub Purchase"}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(tx.amount)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {statusIcon}
                              <span className="text-sm capitalize">{tx.status || "unknown"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono text-muted-foreground">
                              {tx.stripe_payment_intent_id || "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailView;
