import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { getAuthorToken, getNickname, setNickname as saveNick, generateNickname } from "@/lib/anon";
import type { Category } from "@/lib/forum";

export const Route = createFileRoute("/nuevo")({
  head: () => ({
    meta: [
      { title: "Soltar un chisme — Chismes" },
      { name: "description", content: "Crea un foro anónimo. Elige categoría, un apodo y cuenta la historia." },
      { property: "og:title", content: "Soltar un chisme" },
      { property: "og:description", content: "Publica anónimamente en el foro de chismes." },
    ],
  }),
  component: NuevoPost,
});

const schema = z.object({
  title: z.string().trim().min(3, "Muy corto").max(200, "Máximo 200 caracteres"),
  content: z.string().trim().min(10, "Cuenta más detalles").max(5000, "Máximo 5000 caracteres"),
  nickname: z.string().trim().min(2).max(40),
  category_id: z.string().min(1, "Elige una categoría"),
});

function NuevoPost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [nickname, setNick] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setNick(getNickname()); }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ title, content, nickname, category_id: categoryId });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      }
      saveNick(parsed.data.nickname);
      const { data, error } = await supabase.from("posts").insert({
        title: parsed.data.title,
        content: parsed.data.content,
        author_nickname: parsed.data.nickname,
        author_token: getAuthorToken(),
        category_id: parsed.data.category_id,
      }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => navigate({ to: "/post/$id", params: { id } }),
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="min-h-screen bg-gossip">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-display text-4xl font-black">Soltar un chisme 🍿</h1>
        <p className="text-muted-foreground mt-2">
          Nadie sabrá quién eres. Un apodo aleatorio se generó por ti — puedes cambiarlo.
        </p>

        <form
          className="mt-8 grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            create.mutate();
          }}
        >
          <div>
            <label className="block text-sm font-semibold mb-2">Categoría</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`text-left p-3 rounded-xl border transition ${
                    categoryId === c.id
                      ? "border-primary bg-[color-mix(in_oklab,var(--primary)_10%,var(--card))]"
                      : "border-border bg-card hover:border-primary"
                  }`}
                >
                  <div className="text-xl">{c.emoji}</div>
                  <div className="font-semibold text-sm mt-1">{c.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Título del chisme</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Mi mejor amiga y mi novio..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:border-primary focus:ring-4 focus:ring-[color-mix(in_oklab,var(--primary)_20%,transparent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">La historia</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              rows={8}
              placeholder="Cuéntalo todo. Con el drama que se merece."
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:border-primary focus:ring-4 focus:ring-[color-mix(in_oklab,var(--primary)_20%,transparent)] resize-y"
            />
            <div className="text-right text-xs text-muted-foreground mt-1">{content.length}/5000</div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Tu apodo anónimo</label>
            <div className="flex gap-2">
              <input
                value={nickname}
                onChange={(e) => setNick(e.target.value)}
                maxLength={40}
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setNick(generateNickname())}
                className="btn-ghost-hot"
                title="Generar otro"
              >
                🎲
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/30">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={create.isPending} className="btn-hot flex-1">
              {create.isPending ? "Publicando..." : "🚀 Publicar chisme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
