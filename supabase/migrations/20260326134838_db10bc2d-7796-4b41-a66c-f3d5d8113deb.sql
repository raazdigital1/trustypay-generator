-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true);

-- Allow admins to upload
CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images' AND public.is_admin());

-- Allow admins to update
CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images' AND public.is_admin());

-- Allow admins to delete
CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images' AND public.is_admin());

-- Allow public read access
CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');