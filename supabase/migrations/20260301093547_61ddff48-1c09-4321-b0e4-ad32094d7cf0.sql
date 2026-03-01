-- Allow admins to update any subscription
CREATE POLICY "Admins can update any subscription"
ON public.subscriptions
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());