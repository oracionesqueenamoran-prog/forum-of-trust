import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Reactions } from "@/components/reactions";
import { formatRelative, type Category, type Comment, type Post } from "@/lib/forum";
import { getAuthorToken, getNickname, setNickname as saveNick } from "@/lib/anon";

export const Route = createFileRoute("/post/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Chisme #${params.id.slice(0, 6)} — Chismes` },
      { name: "description", content: "Lee este chisme anónimo, reacciona y deja tu comentario." },
      { property: "og:title", content: "Un chisme jugosito en Chismes" },
      { property: "og:description", content: "Historia anónima con comentarios y reacciones." },
    ],
  }),
  component: PostDetail,
});

function PostDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [token, setToken] = useState("");
  const [nick, setNick] = useState("");
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    setToken(getAuthorToken());
    setNick(getNickname());
  }, []);

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Post | null;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments").select("*")
        .eq("post_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const content = commentText.trim();
      if (content.length < 1) throw new Error("Escribe algo");
      if (content.length > 2000) throw new Error("Máximo 2000 caracteres");
      if (nick.trim().length < 2) throw new Error("Elige un apodo");
      saveNick(nick.trim());
      const { error } = await supabase.from("comments").insert({
        post_id: id,
        content,
        author_nickname: nick.trim(),
        author_token: token,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  const deletePost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id)
        .eq("author_token", token);
      if (error) throw error;
    },
    onSuccess: () => navigate({ to: "/" }),
  });

  const deleteComment = useMutation({
    mutationFn: async (cid: string) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", cid)
        .eq("author_token", token);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", id] }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gossip">
        <SiteHeader />
        <p className="text-center py-20 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-gossip">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-5 py-20 text-center">
          <p className="text-5xl mb-3">🫥</p>
          <h1 className="font-display text-3xl font-bold">Este chisme ya no está</h1>
          <p className="text-muted-foreground mt-2">Puede que la autora lo haya borrado.</p>
          <Link to="/" className="btn-hot mt-6">Volver al feed</Link>
        </div>
      </div>
    );
  }

  const cat = categories.find(c => c.id === post.category_id);
  const isMine = token && post.author_token === token;

  return (
    <div className="min-h-screen bg-gossip">
      <SiteHeader />

      <article className="mx-auto max-w-2xl px-5 py-10">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Todos los chismes</Link>

        <div className="mt-4 card-gossip p-7">
          <div className="flex items-center gap-2 flex-wrap text-xs mb-3">
            <span className="chip">{cat?.emoji} {cat?.name ?? post.category_id}</span>
            <span className="text-muted-foreground">
              por <b className="text-wine">{post.author_nickname}</b> · {formatRelative(post.created_at)}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black leading-tight">{post.title}</h1>
          <p className="mt-5 text-lg leading-relaxed whitespace-pre-wrap">{post.content}</p>

          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between flex-wrap gap-3">
            <Reactions target={{ postId: post.id }} />
            {isMine && (
              <button
                onClick={() => {
                  if (confirm("¿Borrar tu chisme?")) deletePost.mutate();
                }}
                className="text-xs text-destructive hover:underline"
              >
                Borrar
              </button>
            )}
          </div>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold mb-4">
            💬 Comentarios <span className="text-muted-foreground text-base">({comments.length})</span>
          </h2>

          <form
            className="card-gossip p-4 mb-6"
            onSubmit={(e) => {
              e.preventDefault();
              addComment.mutate();
            }}
          >
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Deja tu opinión sin miedo..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary resize-y"
            />
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <input
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                maxLength={40}
                placeholder="apodo"
                className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <button
                type="submit"
                disabled={addComment.isPending || commentText.trim().length === 0}
                className="btn-hot text-sm py-2 px-4 disabled:opacity-50"
              >
                Comentar
              </button>
            </div>
            {addComment.error && (
              <p className="text-destructive text-xs mt-2">{(addComment.error as Error).message}</p>
            )}
          </form>

          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Sé la primera en comentar 👀</p>
          ) : (
            <ul className="grid gap-3">
              {comments.map((c) => {
                const mine = token && c.author_token === token;
                return (
                  <li key={c.id} className="card-gossip p-4">
                    <div className="text-xs text-muted-foreground mb-1">
                      <b className="text-wine">{c.author_nickname}</b> · {formatRelative(c.created_at)}
                    </div>
                    <p className="whitespace-pre-wrap">{c.content}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <Reactions target={{ commentId: c.id }} />
                      {mine && (
                        <button
                          onClick={() => {
                            if (confirm("¿Borrar tu comentario?")) deleteComment.mutate(c.id);
                          }}
                          className="text-xs text-destructive hover:underline"
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </article>
    </div>
  );
}
