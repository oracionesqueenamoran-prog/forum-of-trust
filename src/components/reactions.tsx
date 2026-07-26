import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { REACTION_EMOJIS, type Reaction, type ReactionEmoji } from "@/lib/forum";
import { getAuthorToken } from "@/lib/anon";
import { useEffect, useState } from "react";

type Target = { postId: string } | { commentId: string };

function targetKey(t: Target) {
  return "postId" in t ? ["reactions", "post", t.postId] : ["reactions", "comment", t.commentId];
}

export function Reactions({ target }: { target: Target }) {
  const qc = useQueryClient();
  const [token, setToken] = useState("");
  useEffect(() => { setToken(getAuthorToken()); }, []);

  const { data: reactions = [] } = useQuery({
    queryKey: targetKey(target),
    queryFn: async () => {
      const q = supabase.from("reactions").select("*");
      const { data, error } = "postId" in target
        ? await q.eq("post_id", target.postId)
        : await q.eq("comment_id", target.commentId);
      if (error) throw error;
      return (data ?? []) as Reaction[];
    },
  });

  const toggle = useMutation({
    mutationFn: async (emoji: ReactionEmoji) => {
      const existing = reactions.find(r => r.emoji === emoji && r.author_token === token);
      if (existing) {
        const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const payload = {
          post_id: "postId" in target ? target.postId : null,
          comment_id: "commentId" in target ? target.commentId : null,
          emoji,
          author_token: token,
        };
        const { error } = await supabase.from("reactions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: targetKey(target) }),
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {REACTION_EMOJIS.map((emoji) => {
        const count = reactions.filter(r => r.emoji === emoji).length;
        const mine = reactions.some(r => r.emoji === emoji && r.author_token === token);
        return (
          <button
            key={emoji}
            type="button"
            disabled={!token || toggle.isPending}
            onClick={() => toggle.mutate(emoji)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-all ${
              mine
                ? "border-primary bg-[color-mix(in_oklab,var(--primary)_15%,var(--card))] text-wine shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_20%,transparent)]"
                : "border-border bg-card text-muted-foreground hover:border-primary hover:text-wine"
            }`}
            aria-label={`Reaccionar con ${emoji}`}
          >
            <span className="text-base leading-none">{emoji}</span>
            {count > 0 && <span className="text-xs font-semibold tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
