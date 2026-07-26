export const REACTION_EMOJIS = ["😱", "💔", "😂", "🔥", "🤯"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type Category = {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  sort_order: number;
};

export type Post = {
  id: string;
  category_id: string;
  title: string;
  content: string;
  author_nickname: string;
  author_token: string;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  content: string;
  author_nickname: string;
  author_token: string;
  created_at: string;
};

export type Reaction = {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  emoji: ReactionEmoji;
  author_token: string;
  created_at: string;
};

export function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d}d`;
  return new Date(iso).toLocaleDateString("es");
}
