
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved comments
CREATE POLICY "Anyone can view approved comments"
  ON public.blog_comments FOR SELECT
  USING (is_approved = true OR is_admin());

-- Authenticated users can post comments
CREATE POLICY "Authenticated users can post comments"
  ON public.blog_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all comments
CREATE POLICY "Admins can manage comments"
  ON public.blog_comments FOR ALL
  USING (is_admin());
