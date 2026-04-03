import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, User, ArrowLeft } from "lucide-react";
import BlogComments from "@/components/blog/BlogComments";

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  author_name: string | null;
  published_at: string | null;
  featured_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (data) {
        setPost(data);
        if (data.seo_title) document.title = data.seo_title;
        else document.title = `${data.title} | PayStub Wizard Blog`;
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  const sanitizedContent = useMemo(() => {
    if (!post?.content) return "";

    let html = post.content
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/\u00A0/g, " ");

    // Convert empty paragraphs to visible spacing
    html = html.replace(/<p[^>]*>\s*<\/p>/gi, '<div class="my-4"></div>');

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "ul", "ol", "li", "a", "strong", "em", "b", "i", "u", "s", "blockquote", "pre", "code", "img", "table", "thead", "tbody", "tr", "th", "td", "hr", "span", "div", "figure", "figcaption", "sub", "sup"],
      ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "width", "height", "class", "style", "id"],
    });
  }, [post?.content]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <Skeleton className="h-64 w-full mb-6" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 text-center py-16">
            <h1 className="text-4xl font-bold text-foreground mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The blog post you're looking for doesn't exist or has been unpublished.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <article className="container mx-auto px-4 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Blog
          </Link>

          {post?.category && (
            <Badge variant="secondary" className="mb-4">
              {post.category}
            </Badge>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {post?.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            {post?.author_name && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author_name}
              </span>
            )}
            {post?.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.published_at)}
              </span>
            )}
          </div>

          {post?.featured_image_url && (
            <div className="rounded-lg overflow-hidden mb-8">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {sanitizedContent && (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none text-foreground overflow-hidden [overflow-wrap:normal] [word-break:normal] [&_*]:max-w-full [&_p]:whitespace-normal [&_p]:break-normal [&_p]:hyphens-none [&_li]:whitespace-normal [&_li]:break-normal [&_li]:hyphens-none [&_h1]:break-normal [&_h1]:hyphens-none [&_h2]:break-normal [&_h2]:hyphens-none [&_h3]:break-normal [&_h3]:hyphens-none [&_a]:break-all [&_code]:break-all [&_pre]:overflow-x-auto [&_table]:block [&_table]:overflow-x-auto [&_img]:h-auto"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          )}

          {post && <BlogComments postId={post.id} />}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
