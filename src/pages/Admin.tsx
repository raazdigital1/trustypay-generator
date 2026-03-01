import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout, { AdminTab } from "@/components/admin/AdminLayout";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminBlogPosts from "@/components/admin/AdminBlogPosts";
import AdminTaxRates from "@/components/admin/AdminTaxRates";
import AdminPaystubs from "@/components/admin/AdminPaystubs";
import AdminTransactions from "@/components/admin/AdminTransactions";
import AdminFraudFlags from "@/components/admin/AdminFraudFlags";
import AdminBilling from "@/components/admin/AdminBilling";
import AdminAuditLogs from "@/components/admin/AdminAuditLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

const Admin = () => {
  const { isAdmin, loading, user } = useAdminAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview />;
      case "users":
        return <AdminUsers />;
      case "billing":
        return <AdminBilling />;
      case "blog":
        return <AdminBlogPosts />;
      case "tax-rates":
        return <AdminTaxRates />;
      case "paystubs":
        return <AdminPaystubs />;
      case "transactions":
        return <AdminTransactions />;
      case "fraud-flags":
        return <AdminFraudFlags />;
      case "audit-logs":
        return <AdminAuditLogs />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default Admin;
