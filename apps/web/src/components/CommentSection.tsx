"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";
import { websiteApi, type CommentRecord } from "@/lib/api";

function formatCommentDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface CommentSectionProps {
  newsPostId: string;
}

/**
 * Article comments — persisted to the database via the API.
 */
export default function CommentSection({ newsPostId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      const res = await websiteApi.listComments(newsPostId);
      setComments(res);
    } catch {
      // Silently fail — comments are non-critical
    } finally {
      setLoading(false);
    }
  }, [newsPostId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const newComment = await websiteApi.createComment(newsPostId, {
        name: name.trim(),
        text: text.trim(),
      });
      setComments((prev) => [...prev, newComment]);
      setName("");
      setText("");
    } catch {
      setError("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        <MessageCircle className="h-6 w-6 text-brand" />
        Comments ({comments.length})
      </h2>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {comment.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{comment.name}</p>
                  <p className="text-xs text-slate-500">{formatCommentDate(comment.createdAt)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{comment.text}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-slate-100 bg-white p-6 shadow-card">
        <h3 className="text-lg font-bold text-slate-900">Leave a comment</h3>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <div className="mt-4 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts..."
            required
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}
