import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { formatRelative, type Category, type Post } from "@/lib/forum";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chismes — Foros anónimos de infidelidad" },
      { name: "keywords", content: "chismes, anónimo, infidelidad, traición, drama, oficina, karma" },
      { name: "description", content: "El feed de chismes anónimos. Elige una categoría o suelta el tuyo." },
      { property: "og:title", content: "Chismes — Foros anónimos" },
      { property: "og:description", content: "Historias reales, anónimas, con drama del bueno." },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/cotillear.png",},
    ],    
  }),
  component: Home,
});

function Home() {
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", activeCat],
    queryFn: async () => {
      let q = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
      if (activeCat) q = q.eq("category_id", activeCat);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  return (
    <div className="min-h-screen bg-gossip">
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-5 pt-14 pb-10 text-center">
        <span className="chip mb-4">💬 100% anónimo · sin registro</span>
        <h1 className="font-display text-5xl sm:text-7xl font-black leading-[0.95]">
          El rincón donde <span className="text-gradient-hot italic">se cuenta todo</span>.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
          Chismes, traiciones, romances de oficina y karma bien servido. Cuenta el tuyo
          o comenta el de alguien más — sin dar tu nombre.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/nuevo" className="btn-hot">✍️ Soltar un chisme</Link>
          <a href="#feed" className="btn-ghost-hot">👀 Solo mirar</a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
          <button
            onClick={() => setActiveCat(null)}
            className={`chip whitespace-nowrap transition ${
              activeCat === null ? "bg-primary! text-primary-foreground! border-primary!" : ""
            }`}
          >
            🌸 Todo
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`chip whitespace-nowrap transition ${
                activeCat === c.id ? "bg-primary! text-primary-foreground! border-primary!" : ""
              }`}
            >
              <span>{c.emoji}</span> {c.name}
            </button>
          ))}
        </div>
      </section>

      <section id="feed" className="mx-auto max-w-5xl px-5 pb-24">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-16">Cargando chismes...</p>
        ) : posts.length === 0 ? (
          <div className="card-gossip p-10 text-center">
            <p className="text-5xl mb-3">🤫</p>
            <p className="font-display text-2xl">Todavía no hay chismes por acá.</p>
            <p className="text-muted-foreground mt-2">Sé la primera persona en soltar uno.</p>
            <Link to="/nuevo" className="btn-hot mt-5">Empezar el drama</Link>
          </div>
        ) : (
          <ul className="grid gap-4">
            {posts.map((p) => {
              const cat = categories.find(c => c.id === p.category_id);
              return (
                <li key={p.id}>
                  <Link
                    to="/post/$id"
                    params={{ id: p.id }}
                    className="card-gossip card-gossip-hover block p-6"
                  >
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span className="chip">{cat?.emoji} {cat?.name ?? p.category_id}</span>
                      <span className="text-muted-foreground">
                        · por <b className="text-wine">{p.author_nickname}</b> · {formatRelative(p.created_at)}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold leading-tight">{p.title}</h2>
                    <p className="mt-2 text-muted-foreground line-clamp-3">{p.content}</p>
                    <div className="mt-3 text-sm text-primary font-semibold">Leer chisme →</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        💅 Chismes · foro anónimo · sé respetuoso, no des nombres reales
      </footer>
    </div>
  );
}
