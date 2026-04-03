import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText, LayoutDashboard, Users, Newspaper, Calculator,
  Receipt, CreditCard, DollarSign, Shield, LogOut, ChevronLeft, ChevronRight, Menu, AlertTriangle, Tag, BarChart3, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminTab =
  | "overview"
  | "analytics"
  
  | "users"
  | "billing"
  | "blog"
  | "comments"
  | "tax-rates"
  | "paystubs"
  | "transactions"
  | "fraud-flags"
  | "coupons"
  | "audit-logs";

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: React.ReactNode;
}

const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  
  { id: "users", label: "Users", icon: Users },
  { id: "billing", label: "Customers", icon: CreditCard },
  { id: "paystubs", label: "Paystubs", icon: Receipt },
  { id: "transactions", label: "Transactions", icon: DollarSign },
  { id: "fraud-flags", label: "Fraud Flags", icon: AlertTriangle },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "blog", label: "Blog Posts", icon: Newspaper },
  { id: "tax-rates", label: "Tax Rates", icon: Calculator },
  { id: "audit-logs", label: "Audit Logs", icon: Shield },
];

const AdminLayout = ({ activeTab, onTabChange, children }: AdminLayoutProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r border-border",
        mobile ? "w-64" : collapsed ? "w-16" : "w-60",
        "transition-all duration-200"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {(!collapsed || mobile) && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">
              Admin<span className="text-primary">Panel</span>
            </span>
          </Link>
        )}
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (mobile) setMobileOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {(!collapsed || mobile) && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-border">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || mobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground capitalize">
            {navItems.find((n) => n.id === activeTab)?.label || "Admin"}
          </h1>
        </header>

        {/* Page content */}
        <ScrollArea className="flex-1">
          <div className="p-6">{children}</div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AdminLayout;
