import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TaxRate {
  state_code: string;
  state_name: string;
  federal_rate: number;
  state_rate: number;
  social_security_rate: number;
  medicare_rate: number;
  has_state_tax: boolean;
}

export const useTaxRates = () => {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaxRates = async () => {
      try {
        const { data: rates, error } = await supabase
          .from("tax_rates")
          .select("*")
          .order("state_name");
        if (error) {
          console.error("Error fetching tax rates:", error);
          setLoadError("Could not load tax rates. You can still fill in the details manually.");
          return;
        }
        if (rates && rates.length > 0) {
          setTaxRates(rates);
        }
      } catch (err) {
        console.error("Tax rates fetch failed:", err);
        setLoadError("Could not load tax rates. You can still fill in the details manually.");
      } finally {
        setLoading(false);
      }
    };
    fetchTaxRates();
  }, []);

  return { taxRates, loadError, loading };
};
