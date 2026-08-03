'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Clock, ArrowRight, Loader2, X } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { contentApi, type NewsRecord } from '@/lib/api';

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function readTime(body: string) {
  const words = body.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<NewsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openArticle, setOpenArticle] = useState<NewsRecord | null>(null);

  useEffect(() => {
    contentApi
      .news()
      .then(setArticles)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load articles.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Articles"
        description="Guides, opportunities and campus news from the university."
      />

      {loading && (
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading articles…
        </Card>
      )}

      {!loading && error && (
        <Card className="p-10 text-center">
          <Newspaper className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        </Card>
      )}

      {!loading && !error && articles.length === 0 && (
        <Card className="p-10 text-center">
          <Newspaper className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No articles published yet</p>
          <p className="mt-1 text-xs text-slate-400">Check back soon for guides and campus news.</p>
        </Card>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((a) => (
            <Card key={a.id} hover className="flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-brand">
                  {a.category ?? 'News'}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" /> {readTime(a.body)}
                </span>
              </div>
              <h2 className="mt-3 text-base font-bold leading-snug text-slate-900">{a.title}</h2>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-500">
                {a.excerpt ?? a.body.slice(0, 160)}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Newspaper className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">University Newsroom</p>
                    <p className="text-[11px] text-slate-400">{formatDate(a.publishedAt ?? a.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenArticle(a)}
                  className="flex items-center gap-1 text-xs font-semibold text-brand transition hover:text-brand-dark"
                >
                  Read <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Article reader modal */}
      {openArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setOpenArticle(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
            <Card className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-brand">
                  {openArticle.category ?? 'News'}
                </span>
                <button
                  onClick={() => setOpenArticle(null)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close article"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h2 className="mt-3 text-xl font-bold leading-snug text-slate-900">{openArticle.title}</h2>
              <p className="mt-1.5 text-xs text-slate-400">
                University Newsroom · {formatDate(openArticle.publishedAt ?? openArticle.createdAt)} ·{' '}
                {readTime(openArticle.body)} read
              </p>
              {openArticle.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={openArticle.coverUrl}
                  alt={openArticle.title}
                  className="mt-4 max-h-64 w-full rounded-xl object-cover"
                />
              )}
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700">
                {openArticle.body.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">{para}</p>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
