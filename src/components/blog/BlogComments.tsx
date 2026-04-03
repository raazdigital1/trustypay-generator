import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Send, User } from "lucide-react";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  is_approved: boolean;
}

interface BlogCommentsProps {
  postId: string;
}

const BlogComments = ({ postId }: BlogCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");

  const fetchComments = async () => {
    const { data } = await supabase
      .from("blog_comments")
      .select("id, author_name, content, created_at, is_approved")
      .eq("blog_post_id", postId)
      .eq("is_approved", true)
      .order("created_at", { ascending: true });
    setComments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please log in to comment", variant: "destructive" });
      return;
    }
    if (!content.trim() || !authorName.trim()) {
      toast({ title: "Name and comment are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("blog_comments").insert({
      blog_post_id: postId,
      user_id: user.id,
      author_name: authorName.trim(),
      content: content.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to post comment", variant: "destructive" });
    } else {
      toast({ title: "Comment submitted! It will appear after approval." });
      setContent("");
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-primary" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* Comment list */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground text-sm mb-8">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4 mb-8">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.author_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-line">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Leave a Comment</h3>
        {!user ? (
          <p className="text-sm text-muted-foreground">
            Please <a href="/login" className="text-primary underline">log in</a> to leave a comment.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="author-name">Name</Label>
              <Input
                id="author-name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment-content">Comment</Label>
              <Textarea
                id="comment-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
                maxLength={2000}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Submitting..." : "Post Comment"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
};

export default BlogComments;
