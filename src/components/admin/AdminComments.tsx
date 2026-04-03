import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Check, X, Trash2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  blog_post_id: string;
  author_name: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  post_title?: string;
}

const AdminComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    setLoading(true);
    // Fetch comments and post titles separately since we can't join easily
    const { data: commentsData, error } = await supabase
      .from("blog_comments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch comments error:", error);
      setLoading(false);
      return;
    }

    // Fetch post titles for the comments
    const postIds = [...new Set((commentsData || []).map((c: any) => c.blog_post_id))];
    let postMap: Record<string, string> = {};
    if (postIds.length > 0) {
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, title")
        .in("id", postIds);
      postMap = (posts || []).reduce((acc: Record<string, string>, p: any) => {
        acc[p.id] = p.title;
        return acc;
      }, {});
    }

    setComments(
      (commentsData || []).map((c: any) => ({
        ...c,
        post_title: postMap[c.blog_post_id] || "Unknown Post",
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("blog_comments")
      .update({ is_approved: !currentStatus })
      .eq("id", id);
    if (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    } else {
      toast({ title: currentStatus ? "Comment unapproved" : "Comment approved" });
      fetchComments();
    }
  };

  const deleteComment = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    const { error } = await supabase.from("blog_comments").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      toast({ title: "Comment deleted" });
      fetchComments();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Blog Comments
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchComments}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading comments...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Post</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.author_name}</TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm">
                        {c.content}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                        {c.post_title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.is_approved ? "default" : "secondary"}>
                          {c.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleApproval(c.id, c.is_approved)}
                            title={c.is_approved ? "Unapprove" : "Approve"}
                          >
                            {c.is_approved ? (
                              <X className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteComment(c.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {comments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No comments yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminComments;
