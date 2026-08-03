"use client";

import { useState, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";

type Comment = {
  id: number;
  name: string;
  date: string;
  text: string;
};

const seedComments: Comment[] = [
  {
    id: 1,
    name: "Grace O.",
    date: "June 20, 2026",
    text: "Wonderful news! So proud of what the university is building for students.",
  },
  {
    id: 2,
    name: "Michael T.",
    date: "June 21, 2026",
    text: "Looking forward to the open seminars. Will they be streamed online?",
  },
];

/**
 * Article comments UI (demo — comments are held in local state only).
 */
export default function CommentSection() {
  const [comments, setComments] = useState<Comment[]>(seedComments);
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: name.trim(),
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        text: text.trim(),
      },
    ]);
    setName("");
    setText("");
  };

  return (
    <div className="mt-12">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        <MessageCircle className="h-6 w-6 text-brand" />
        Comments ({comments.length})
      </h2>

      <div className="mt-6 space-y-5">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {comment.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{comment.name}</p>
                <p className="text-xs text-slate-500">{comment.date}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{comment.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-slate-100 bg-white p-6 shadow-card">
        <h3 className="text-lg font-bold text-slate-900">Leave a comment</h3>
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
            className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Post Comment
          </button>
        </div>
      </form>
    </div>
  );
}
