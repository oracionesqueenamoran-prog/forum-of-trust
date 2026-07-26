
-- Categories
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read_all" ON public.categories FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.categories (id, name, emoji, description, sort_order) VALUES
  ('pareja', 'Pareja', '💔', 'Chismes sobre parejas infieles', 1),
  ('familia', 'Familia', '👨‍👩‍👧', 'Enredos familiares y traiciones', 2),
  ('amigos', 'Amigos', '🐍', 'Cuando el mejor amigo no lo era tanto', 3),
  ('trabajo', 'Trabajo', '💼', 'Romances y traiciones en la oficina', 4),
  ('descubrimiento', 'Descubrimiento', '🕵️', 'Cómo te enteraste de todo', 5),
  ('venganza', 'Venganza', '🔥', 'Historias de karma y venganza', 6);

-- Posts (foros)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES public.categories(id),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 10 AND 5000),
  author_nickname TEXT NOT NULL CHECK (char_length(author_nickname) BETWEEN 2 AND 40),
  author_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX posts_category_idx ON public.posts(category_id, created_at DESC);
CREATE INDEX posts_created_idx ON public.posts(created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.posts TO anon, authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_read_all" ON public.posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "posts_insert_all" ON public.posts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE TO anon, authenticated
  USING (author_token = current_setting('request.headers', true)::json->>'x-author-token');

-- Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  author_nickname TEXT NOT NULL CHECK (char_length(author_nickname) BETWEEN 2 AND 40),
  author_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX comments_post_idx ON public.comments(post_id, created_at ASC);
GRANT SELECT, INSERT, DELETE ON public.comments TO anon, authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read_all" ON public.comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "comments_insert_all" ON public.comments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO anon, authenticated
  USING (author_token = current_setting('request.headers', true)::json->>'x-author-token');

-- Reactions (emojis on posts OR comments)
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('😱','💔','😂','🔥','🤯')),
  author_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((post_id IS NOT NULL)::int + (comment_id IS NOT NULL)::int = 1)
);
CREATE UNIQUE INDEX reactions_unique_post ON public.reactions(post_id, author_token, emoji) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX reactions_unique_comment ON public.reactions(comment_id, author_token, emoji) WHERE comment_id IS NOT NULL;
CREATE INDEX reactions_post_idx ON public.reactions(post_id);
CREATE INDEX reactions_comment_idx ON public.reactions(comment_id);
GRANT SELECT, INSERT, DELETE ON public.reactions TO anon, authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_read_all" ON public.reactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reactions_insert_all" ON public.reactions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "reactions_delete_own" ON public.reactions FOR DELETE TO anon, authenticated
  USING (author_token = current_setting('request.headers', true)::json->>'x-author-token');
