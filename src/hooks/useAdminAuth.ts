import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });

        if (error) {
          console.error("Admin check error:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err) {
        console.error("Admin check failed:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading]);

  return { isAdmin, loading: authLoading || loading, user };
};
