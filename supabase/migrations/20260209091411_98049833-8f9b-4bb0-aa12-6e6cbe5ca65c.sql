-- Allow admins to insert, update, and delete tax rates
CREATE POLICY "Admins can manage tax rates"
ON public.tax_rates
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow admins to manage blog posts (insert/update/delete already covered by ALL policy)
-- Already exists, skip

-- Allow admins to insert audit logs
-- Already exists, skip
