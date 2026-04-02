import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, Plus, Pencil, Trash2, RefreshCw, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";


interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  author_name: string | null;
  is_published: boolean | null;
  published_at: string | null;
  created_at: string;
  seo_title: string | null;
  seo_description: string | null;
}

const emptyPost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "",
  author_name: "PayStub Wizard Team",
  is_published: false,
  seo_title: "",
  seo_description: "",
  featured_image_url: "",
};

const AdminBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openCreate = () => {
    setEditingPost({ ...emptyPost });
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost({ ...post });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPost?.title || !editingPost?.slug) {
      toast({ title: "Title and slug are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: editingPost.title,
        slug: editingPost.slug,
        excerpt: editingPost.excerpt || null,
        content: editingPost.content || null,
        category: editingPost.category || null,
        author_name: editingPost.author_name || "PayStub Wizard Team",
        is_published: editingPost.is_published || false,
        published_at: editingPost.is_published ? new Date().toISOString() : null,
        seo_title: editingPost.seo_title || null,
        seo_description: editingPost.seo_description || null,
        featured_image_url: (editingPost as any).featured_image_url || null,
      };

      if (editingPost.id) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editingPost.id);
        if (error) throw error;
        toast({ title: "Post updated" });
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
        toast({ title: "Post created" });
      }

      setDialogOpen(false);
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Post deleted" });
      fetchPosts();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const updateField = (field: string, value: unknown) => {
    setEditingPost((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              Blog Posts
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchPosts}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {post.title}
                      </TableCell>
                      <TableCell>{post.category || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={post.is_published ? "default" : "secondary"}>
                          {post.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {posts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No blog posts yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost?.id ? "Edit Post" : "New Post"}</DialogTitle>
            <DialogDescription>Fill in the blog post details below.</DialogDescription>
          </DialogHeader>

          {editingPost && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={editingPost.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    value={editingPost.slug || ""}
                    onChange={(e) => updateField("slug", e.target.value)}
                    placeholder="my-blog-post"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={editingPost.category || ""}
                    onChange={(e) => updateField("category", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input
                    value={editingPost.author_name || ""}
                    onChange={(e) => updateField("author_name", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Excerpt</Label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={editingPost.excerpt || ""}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <ReactQuill
                  theme="snow"
                  value={editingPost.content || ""}
                  onChange={(value) => updateField("content", value)}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, 4, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["blockquote", "code-block"],
                      ["link", "image"],
                      [{ align: [] }],
                      ["clean"],
                    ],
                  }}
                  className="bg-background [&_.ql-toolbar]:border-input [&_.ql-container]:border-input [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:rounded-b-md [&_.ql-editor]:min-h-[200px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                {(editingPost as any).featured_image_url && (
                  <div className="relative w-full max-w-xs">
                    <img
                      src={(editingPost as any).featured_image_url}
                      alt="Featured"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => updateField("featured_image_url", "")}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="featured-image-upload"
                    className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload Image"}
                  </label>
                  <input
                    id="featured-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const ext = file.name.split(".").pop();
                        const filePath = `${crypto.randomUUID()}.${ext}`;
                        const { error } = await supabase.storage
                          .from("blog-images")
                          .upload(filePath, file);
                        if (error) throw error;
                        const { data: urlData } = supabase.storage
                          .from("blog-images")
                          .getPublicUrl(filePath);
                        updateField("featured_image_url", urlData.publicUrl);
                        toast({ title: "Image uploaded" });
                      } catch (err) {
                        console.error("Upload error:", err);
                        toast({ title: "Upload failed", variant: "destructive" });
                      } finally {
                        setUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SEO Title</Label>
                  <Input
                    value={editingPost.seo_title || ""}
                    onChange={(e) => updateField("seo_title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SEO Description</Label>
                  <Input
                    value={editingPost.seo_description || ""}
                    onChange={(e) => updateField("seo_description", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingPost.is_published || false}
                  onCheckedChange={(v) => updateField("is_published", v)}
                />
                <Label>Published</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogPosts;
