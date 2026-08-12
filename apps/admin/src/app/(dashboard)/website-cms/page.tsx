'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Award,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Database,
  Download,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Pencil,
  Plus,
  Quote,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  Video,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import { cn } from '@/lib/utils';
import {
  cmsApi,
  type GalleryItemRecord,
  type WebsiteContentRecord,
} from '@/lib/api';

type Tab = 'content' | 'gallery';
type ContentSection = 'stats' | 'testimonials' | 'management' | 'contact' | 'fees' | 'pillars' | 'certificates' | 'coreValues' | 'alumni' | 'admissionReqs' | 'admissionProgrammes' | 'academicsNote' | 'hero';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000';

/* ──── Typed data shapes ──── */
interface StatItem { label: string; value: string }
interface TestimonialItem { name: string; role: string; quote: string }
interface TeamItem { name: string; role: string; bio: string; photo: string }
interface ContactData { address: string; phone: string; email: string; hours: string }
interface FeeItem { item: string; amount: string }
interface FeeScheduleDoc { url: string; name: string }
interface PillarsData { pledge: string; vision: string; mission: string; accreditation: string }
interface CertificateItem { title: string; image: string; issuer: string }
interface AlumniStoryItem { name: string; graduationYear: string; programme: string; currentRole: string; story: string }
interface AdmissionReqItem { title: string; body: string }
interface AdmissionProgrammeItem { name: string; duration: string }
interface HeroSlideItem { image: string; eyebrow: string; title: string; subtitle: string; ctaLabel: string; ctaHref: string }

/* ──── Helpers ──── */
function parseBody<T>(body: unknown, fallback: T): T {
  if (body == null) return fallback;
  if (typeof body === 'string') {
    try { return JSON.parse(body) as T; } catch { return fallback; }
  }
  if (typeof body === 'object') {
    const rec = body as Record<string, unknown>;
    if (typeof rec.text === 'string') {
      try { return JSON.parse(rec.text) as T; } catch { return fallback; }
    }
    return body as T;
  }
  return fallback;
}

function formatWhen(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function WebsiteCmsPage() {
  const [tab, setTab] = useState<Tab>('content');
  const [blocks, setBlocks] = useState<WebsiteContentRecord[]>([]);
  const [gallery, setGallery] = useState<GalleryItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* Auto-dismiss success toast after 3 seconds */
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  /* ── Content section modals ── */
  const [activeSection, setActiveSection] = useState<ContentSection | null>(null);

  /* Stats state */
  const [stats, setStats] = useState<StatItem[]>([]);
  /* Testimonials state */
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  /* Management state */
  const [team, setTeam] = useState<TeamItem[]>([]);
  /* Contact state */
  const [contact, setContact] = useState<ContactData>({ address: '', phone: '', email: '', hours: '' });
  /* Fees state */
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [feeScheduleDoc, setFeeScheduleDoc] = useState<FeeScheduleDoc | null>(null);
  const [feeDocFile, setFeeDocFile] = useState<File | null>(null);
  const [feeDocUploading, setFeeDocUploading] = useState(false);
  /* About pillars state */
  const [pillars, setPillars] = useState<PillarsData>({ pledge: '', vision: '', mission: '', accreditation: '' });
  /* Certificates state */
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  /* Core values state */
  const [coreValues, setCoreValues] = useState<string[]>([]);
  /* Alumni stories state */
  const [alumniStories, setAlumniStories] = useState<AlumniStoryItem[]>([]);
  /* Admission requirements state */
  const [admissionReqs, setAdmissionReqs] = useState<AdmissionReqItem[]>([]);
  /* Admission programmes state */
  const [admissionProgrammes, setAdmissionProgrammes] = useState<AdmissionProgrammeItem[]>([]);
  /* Academics learning pathways note */
  const [academicsNote, setAcademicsNote] = useState('');
  /* Hero slider state */
  const [heroSlides, setHeroSlides] = useState<HeroSlideItem[]>([]);
  const [heroUploading, setHeroUploading] = useState(false);
  /* Certificate image upload */
  const [certUploading, setCertUploading] = useState(false);
  /* Deleting state */
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  /* Gallery modal */
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaAlbum, setMediaAlbum] = useState('');
  const [mediaType, setMediaType] = useState('IMAGE');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileKey, setFileKey] = useState(0);
  const [lightboxItem, setLightboxItem] = useState<GalleryItemRecord | null>(null);

  /* Gallery edit/delete state */
  const [editingItem, setEditingItem] = useState<GalleryItemRecord | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editType, setEditType] = useState('IMAGE');
  const [deletingItem, setDeletingItem] = useState<GalleryItemRecord | null>(null);

  function resetGalleryForm() {
    setMediaUrl(''); setMediaCaption(''); setMediaAlbum('');
    setMediaType('IMAGE'); setUploadFile(null); setUploadMode('file');
    setFileKey((k) => k + 1);
  }

  /* ── Load all data ── */
  const load = useCallback(async () => {
    setError(null);
    try {
      const [content, items] = await Promise.all([cmsApi.content(), cmsApi.gallery()]);
      setBlocks(content);
      setGallery(items);

      // Parse each section
      const find = (key: string) => content.find((b) => b.key === key);
      setStats(parseBody<StatItem[]>(find('home.stats')?.body, []));
      setTestimonials(parseBody<TestimonialItem[]>(find('home.testimonials')?.body, []));
      setTeam(parseBody<TeamItem[]>(find('about.management')?.body, []));
      setContact(parseBody<ContactData>(find('contact.info')?.body, { address: '', phone: '', email: '', hours: '' }));
      setFees(parseBody<FeeItem[]>(find('admission.fees')?.body, []));
      setFeeScheduleDoc(parseBody<FeeScheduleDoc | null>(find('admission.feeSchedule')?.body, null));
      setPillars(parseBody<PillarsData>(find('about.pillars')?.body, { pledge: '', vision: '', mission: '', accreditation: '' }));
      setCertificates(parseBody<CertificateItem[]>(find('about.certificates')?.body, []));
      setCoreValues(parseBody<string[]>(find('about.coreValues')?.body, []));
      setAlumniStories(parseBody<AlumniStoryItem[]>(find('alumni.stories')?.body, []));
      setAdmissionReqs(parseBody<AdmissionReqItem[]>(find('admission.requirements')?.body, []));
      setAdmissionProgrammes(parseBody<AdmissionProgrammeItem[]>(find('admission.programmes')?.body, []));
      setAcademicsNote(parseBody<string>(find('academics.note')?.body, ''));
      setHeroSlides(parseBody<HeroSlideItem[]>(find('hero.slides')?.body, []));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load website content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  /* ── Save helpers ── */
  async function saveSection(key: string, body: unknown) {
    setBusy('save');
    setError(null);
    try {
      await cmsApi.upsertContent({ key, body });
      await load();
      setActiveSection(null);
      setSuccessMsg('Saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setBusy(null);
    }
  }

  async function uploadFeeScheduleDoc() {
    if (!feeDocFile) return;
    setFeeDocUploading(true);
    setError(null);
    try {
      const result = await cmsApi.uploadMedia(feeDocFile);
      const doc: FeeScheduleDoc = { url: result.url, name: feeDocFile.name };
      setFeeScheduleDoc(doc);
      setFeeDocFile(null);
      await cmsApi.upsertContent({ key: 'admission.feeSchedule', body: doc });
      await load();
      setSuccessMsg('Fee schedule document uploaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document.');
    } finally {
      setFeeDocUploading(false);
    }
  }

  async function removeFeeScheduleDoc() {
    if (!feeScheduleDoc) return;
    setBusy('delete');
    try {
      await cmsApi.upsertContent({ key: 'admission.feeSchedule', body: null });
      setFeeScheduleDoc(null);
      await load();
      setSuccessMsg('Fee schedule document removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove document.');
    } finally {
      setBusy(null);
    }
  }

  async function deleteSection(key: string) {
    if (!window.confirm(`Are you sure you want to delete this content? The website will fall back to default values.`)) return;
    setDeletingKey(key);
    setError(null);
    try {
      await cmsApi.deleteContent(key);
      await load();
      setSuccessMsg('Content deleted. Website will use defaults.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.');
    } finally {
      setDeletingKey(null);
    }
  }

  /* ── Gallery handlers ── */
  async function handleAddMedia(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy('add-media');
    try {
      let finalUrl = mediaUrl.trim();
      if (uploadMode === 'file' && uploadFile) {
        setUploading(true);
        const result = await cmsApi.uploadMedia(uploadFile);
        finalUrl = result.url;
        setUploading(false);
      }
      if (!finalUrl) { setError('Please provide a URL or select a file.'); setBusy(null); return; }
      await cmsApi.addGalleryItem({ url: finalUrl, type: mediaType, caption: mediaCaption.trim() || undefined, album: mediaAlbum.trim() || undefined });
      setGalleryOpen(false); resetGalleryForm();
      setSuccessMsg('Gallery item added.');
      await load();
    } catch (err) {
      setUploading(false); setError(err instanceof Error ? err.message : 'Failed to add.');
    } finally { setBusy(null); }
  }

  function openEditModal(item: GalleryItemRecord) {
    setEditingItem(item);
    setEditUrl(item.url);
    setEditCaption(item.caption ?? '');
    setEditAlbum(item.album ?? '');
    setEditType(item.type);
  }

  async function handleUpdateGallery(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingItem) return;
    setBusy('update-gallery');
    try {
      await cmsApi.updateGalleryItem(editingItem.id, {
        url: editUrl.trim(),
        type: editType,
        caption: editCaption.trim() || undefined,
        album: editAlbum.trim() || undefined,
      });
      setEditingItem(null);
      setSuccessMsg('Gallery item updated.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update.');
    } finally { setBusy(null); }
  }

  async function handleDeleteGallery() {
    if (!deletingItem) return;
    setBusy('delete-gallery');
    try {
      await cmsApi.deleteGalleryItem(deletingItem.id);
      setDeletingItem(null);
      setSuccessMsg('Gallery item deleted.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.');
    } finally { setBusy(null); }
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <PageHeader
        title="Website CMS"
        subtitle="Manage the content and gallery of your public school website."
        action={
          <div className="flex items-center gap-2">
            <a href={WEB_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-1.5">
              <ExternalLink className="h-4 w-4" /> Preview on Website
            </a>
            {tab === 'gallery' && (
              <button type="button" onClick={() => { resetGalleryForm(); setGalleryOpen(true); }} className="btn-primary">
                <Plus className="h-4 w-4" /> Add Media
              </button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-card">
        <button type="button" onClick={() => setTab('content')}
          className={cn('flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
            tab === 'content' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900')}>
          <Database className="h-4 w-4" /> Website Content
        </button>
        <button type="button" onClick={() => setTab('gallery')}
          className={cn('flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
            tab === 'gallery' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900')}>
          <ImageIcon className="h-4 w-4" /> Gallery
        </button>
      </div>

      {successMsg && (
        <div className="fixed right-4 top-4 z-50 animate-slide-in rounded-xl border border-green-200 bg-white px-5 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </span>
            <span className="text-sm font-medium text-gray-800">{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg(null)} className="ml-2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {error && <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      {/* ════════════════ CONTENT TAB ════════════════ */}
      {tab === 'content' && (
        <div className="space-y-5">
          {loading ? (
            <p className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">Loading content…</p>
          ) : (
            <>
              {/* ── 0. Hero Slider ── */}
              <Card
                title="Hero Slider"
                subtitle="Image slides displayed in the homepage hero banner at the top of the website"
                action={
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setActiveSection('hero')} className="btn-secondary px-3 py-1.5 text-xs">
                      {heroSlides.length === 0 ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                    </button>
                    {heroSlides.length > 0 && (
                      <button type="button" onClick={() => deleteSection('hero.slides')} disabled={deletingKey === 'hero.slides'}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                }
              >
                {heroSlides.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No hero slides configured yet. Using website defaults.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    {heroSlides.map((s, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                        <img src={s.image} alt={s.eyebrow} className="h-28 w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <span className="inline-block rounded-full bg-red-600/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">{s.eyebrow}</span>
                          <p className="mt-1 line-clamp-2 text-xs font-semibold text-white">{s.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── 1. Homepage Stats ── */}
              <Card
                title="Homepage Stats"
                subtitle="Numbers displayed in the stats band at the bottom of the homepage"
                action={
                  <button type="button" onClick={() => setActiveSection('stats')} className="btn-secondary px-3 py-1.5 text-xs">
                    {stats.length === 0 ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                }
              >
                {stats.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No stats configured yet. Using website defaults.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                    {stats.map((s, i) => (
                      <div key={i} className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 text-center">
                        <p className="text-2xl font-extrabold text-brand">{s.value}</p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── 2. Testimonials ── */}
              <Card
                title="Testimonials"
                subtitle='Quotes shown in the "What Our Community Says" section on the homepage'
                action={
                  <button type="button" onClick={() => setActiveSection('testimonials')} className="btn-secondary px-3 py-1.5 text-xs">
                    {testimonials.length === 0 ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                }
              >
                {testimonials.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No testimonials configured yet. Using website defaults.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {testimonials.map((t, i) => (
                      <div key={i} className="flex items-start gap-4 px-5 py-4">
                        <Quote className="mt-1 h-5 w-5 shrink-0 text-brand-light" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm italic text-gray-700">"{t.quote}"</p>
                          <p className="mt-1.5 text-xs font-semibold text-gray-900">{t.name} <span className="font-normal text-gray-400">— {t.role}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── 3. Management Team ── */}
              <Card
                title="Management Team"
                subtitle="Leadership team displayed on the About page"
                action={
                  <button type="button" onClick={() => setActiveSection('management')} className="btn-secondary px-3 py-1.5 text-xs">
                    {team.length === 0 ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                }
              >
                {team.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No management team configured yet. Using website defaults.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                    {team.map((m, i) => (
                      <div key={i} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                          {m.name.split(' ').filter(w => !/^(prof\.?|dr\.?|mr\.?|mrs\.?|barr\.?|sir)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{m.name}</p>
                          <p className="text-xs font-medium text-brand">{m.role}</p>
                          {m.bio && <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{m.bio}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── 4. Contact Details ── */}
              <Card
                title="Contact Details"
                subtitle="School contact information shown in the footer and Contact page"
                action={
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setActiveSection('contact')} className="btn-secondary px-3 py-1.5 text-xs">
                      {!(contact.address || contact.phone || contact.email) ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                    </button>
                    {(contact.address || contact.phone || contact.email) && (
                      <button type="button" onClick={() => deleteSection('contact.info')} disabled={deletingKey === 'contact.info'}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                }
              >
                {(contact.address || contact.phone || contact.email) ? (
                  <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <div><p className="text-xs font-medium text-gray-400">Address</p><p className="text-sm text-gray-800">{contact.address || '—'}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <div><p className="text-xs font-medium text-gray-400">Phone</p><p className="text-sm text-gray-800">{contact.phone || '—'}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <div><p className="text-xs font-medium text-gray-400">Email</p><p className="text-sm text-gray-800">{contact.email || '—'}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <div><p className="text-xs font-medium text-gray-400">Office Hours</p><p className="text-sm text-gray-800">{contact.hours || '—'}</p></div>
                    </div>
                  </div>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No contact details configured yet. Using website defaults.</p>
                )}
              </Card>

              {/* ── 5. Fee Structure ── */}
              <Card
                title="Fee Structure"
                subtitle="Fee items and schedule document displayed on the Admission page"
                action={
                  <button type="button" onClick={() => setActiveSection('fees')} className="btn-secondary px-3 py-1.5 text-xs">
                    {fees.length === 0 && !feeScheduleDoc ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                }
              >
                {fees.length === 0 && !feeScheduleDoc ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No fee structure configured yet. Using website defaults.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {fees.length > 0 && (
                      <div className="overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            <tr><th className="px-5 py-3">Item</th><th className="px-5 py-3 text-right">Amount</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {fees.map((f, i) => (
                              <tr key={i} className="bg-white hover:bg-gray-50/50">
                                <td className="px-5 py-3 text-gray-800">{f.item}</td>
                                <td className="px-5 py-3 text-right font-semibold text-brand">{f.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {feeScheduleDoc && (
                      <div className="flex items-center gap-3 px-5 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800">{feeScheduleDoc.name}</p>
                          <p className="text-xs text-gray-400">Schedule of Fees Document</p>
                        </div>
                        <a href={feeScheduleDoc.url} target="_blank" rel="noopener noreferrer"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-brand">
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* ── 6. About Page Pillars ── */}
              <Card
                title="About Page — Pledge, Vision, Mission, Accreditation"
                subtitle="The four pillar cards displayed on the About page"
                action={
                  <button type="button" onClick={() => setActiveSection('pillars')} className="btn-secondary px-3 py-1.5 text-xs">
                    {!(pillars.pledge || pillars.vision || pillars.mission || pillars.accreditation) ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                }
              >
                {(pillars.pledge || pillars.vision || pillars.mission || pillars.accreditation) ? (
                  <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                    {([['Our Pledge', pillars.pledge], ['Our Vision', pillars.vision], ['Our Mission', pillars.mission], ['Accreditation', pillars.accreditation]] as const).map(([label, text]) => (
                      <div key={label} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand">{label}</p>
                        <p className="mt-1 line-clamp-3 text-sm text-gray-700">{text || '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No pillars configured yet. Using website defaults.</p>
                )}
              </Card>

              {/* ── 7. Certifications ── */}
              <Card
                title="Certifications & Licences"
                subtitle="Certificate images and descriptions shown on the About page"
                action={
                  <button type="button" onClick={() => setActiveSection('certificates')} className="btn-secondary px-3 py-1.5 text-xs">
                    {certificates.length === 0 ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                }
              >
                {certificates.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No certifications configured yet. Using website defaults.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    {certificates.map((c, i) => (
                      <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50/50">
                        {c.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.image} alt={c.title} className="h-28 w-full object-contain bg-white p-2" loading="lazy" />
                        ) : (
                          <div className="flex h-28 items-center justify-center bg-gray-100"><ShieldCheck className="h-8 w-8 text-gray-300" /></div>
                        )}
                        <div className="p-3">
                          <p className="truncate text-sm font-semibold text-gray-900">{c.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{c.issuer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── 8. Core Values ── */}
              <Card
                title="Core Values"
                subtitle="Values displayed in the gradient strip on the About page"
                action={
                  <button type="button" onClick={() => setActiveSection('coreValues')} className="btn-secondary px-3 py-1.5 text-xs">
                    {coreValues.length === 0 ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                }
              >
                {coreValues.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No core values configured yet. Using website defaults.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 p-5">
                    {coreValues.map((v, i) => (
                      <span key={i} className="rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-sm font-semibold text-brand">{v}</span>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── 9. Alumni Success Stories ── */}
              <Card
                title="Alumni Success Stories"
                subtitle="Graduate stories displayed on the Alumni page"
                action={
                  <button type="button" onClick={() => setActiveSection('alumni')} className="btn-secondary px-3 py-1.5 text-xs">
                    {alumniStories.length === 0 ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                }
              >
                {alumniStories.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No alumni stories configured yet. Using website defaults.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {alumniStories.map((s, i) => (
                      <div key={i} className="flex items-start gap-4 px-5 py-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-xs font-bold text-white">
                          {s.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                          <p className="text-xs text-brand">{s.currentRole} {s.programme && `· ${s.programme}`} {s.graduationYear && `· Class of ${s.graduationYear}`}</p>
                          {s.story && <p className="mt-1 line-clamp-2 text-xs text-gray-500">"{s.story}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── 10. Admission Requirements ── */}
              <Card
                title="Admission Requirements"
                subtitle="Requirement cards displayed on the Admission page"
                action={
                  <button type="button" onClick={() => setActiveSection('admissionReqs')} className="btn-secondary px-3 py-1.5 text-xs">
                    {admissionReqs.length === 0 ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                }
              >
                {admissionReqs.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No requirements configured yet. Using website defaults.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {admissionReqs.map((r, i) => (
                      <div key={i} className="flex items-start gap-4 px-5 py-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{r.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── 10b. Admission Programmes ── */}
              <Card
                title="Programmes of Interest"
                subtitle="Programme options displayed in the Admission page application form"
                action={
                  <button type="button" onClick={() => setActiveSection('admissionProgrammes')} className="btn-secondary px-3 py-1.5 text-xs">
                    {admissionProgrammes.length === 0 ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                }
              >
                {admissionProgrammes.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No programmes configured yet. Using website defaults.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {admissionProgrammes.map((p, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── 11. Academics Learning Pathways Note ── */}
              <Card
                title="Academics — Learning Pathways Note"
                subtitle="The note displayed at the bottom of the Academics page"
                action={
                  <button type="button" onClick={() => setActiveSection('academicsNote')} className="btn-secondary px-3 py-1.5 text-xs">
                    {!academicsNote ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                  </button>
                }
              >
                {academicsNote ? (
                  <div className="flex items-start gap-4 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Flexible learning pathways</p>
                      <p className="mt-1 text-sm text-gray-600">{academicsNote}</p>
                    </div>
                  </div>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No note configured yet. Using website default.</p>
                )}
              </Card>
            </>
          )}
        </div>
      )}

      {/* ════════════════ GALLERY TAB ════════════════ */}
      {tab === 'gallery' && (
        loading ? (
          <p className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">Loading gallery…</p>
        ) : gallery.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
            No gallery items yet. Add photos or videos to showcase campus life.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {gallery.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
                {item.type === 'VIDEO' ? (
                  <a href={item.url} target="_blank" rel="noreferrer" className="flex h-40 items-center justify-center bg-gray-900 text-gray-300 transition hover:text-white">
                    <Video className="h-10 w-10" />
                  </a>
                ) : (
                  <button type="button" onClick={() => setLightboxItem(item)} className="block w-full cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.caption ?? 'Gallery image'} className="h-40 w-full object-cover transition-opacity hover:opacity-90" loading="lazy" />
                  </button>
                )}
                <div className="px-4 py-3">
                  <p className="truncate text-sm font-medium text-gray-800">{item.caption || 'Untitled'}</p>
                  <p className="mt-0.5 text-xs font-medium text-amber-600">{item.album ? `Album: ${item.album}` : 'No album'}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <button type="button" onClick={() => openEditModal(item)}
                      className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button type="button" onClick={() => setDeletingItem(item)}
                      className="flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODALS
         ══════════════════════════════════════════════════════════════════ */}

      {/* ── Stats Modal ── */}
      {activeSection === 'stats' && (
        <SectionModal
          title="Homepage Stats"
          description="Each stat shows a number and its label. These appear in the gradient stats band on the homepage."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('home.stats', stats)}
          busy={busy === 'save'}
        >
          <div className="space-y-3">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <input value={s.value} onChange={(e) => { const copy = [...stats]; copy[i] = { ...s, value: e.target.value }; setStats(copy); }}
                    placeholder="e.g. 8" className="input text-center text-lg font-bold" />
                </div>
                <div className="flex-[2]">
                  <input value={s.label} onChange={(e) => { const copy = [...stats]; copy[i] = { ...s, label: e.target.value }; setStats(copy); }}
                    placeholder="e.g. Academic Departments" className="input" />
                </div>
                <button type="button" onClick={() => setStats(stats.filter((_, j) => j !== i))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setStats([...stats, { label: '', value: '' }])}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand">
              <Plus className="h-4 w-4" /> Add Stat
            </button>
          </div>
        </SectionModal>
      )}

      {/* ── Testimonials Modal ── */}
      {activeSection === 'testimonials' && (
        <SectionModal
          title="Testimonials"
          description="Each testimonial has a name, role/title, and quote. Displayed in the community voices section."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('home.testimonials', testimonials)}
          busy={busy === 'save'}
        >
          <div className="space-y-4">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Testimonial {i + 1}</span>
                  <button type="button" onClick={() => setTestimonials(testimonials.filter((_, j) => j !== i))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input value={t.name} onChange={(e) => { const c = [...testimonials]; c[i] = { ...t, name: e.target.value }; setTestimonials(c); }}
                    placeholder="Full name" className="input" />
                  <input value={t.role} onChange={(e) => { const c = [...testimonials]; c[i] = { ...t, role: e.target.value }; setTestimonials(c); }}
                    placeholder="Role / title (e.g. Final Year Student, Parent, Alumnus)" className="input" />
                  <textarea value={t.quote} onChange={(e) => { const c = [...testimonials]; c[i] = { ...t, quote: e.target.value }; setTestimonials(c); }}
                    placeholder="Their quote…" rows={3} className="input resize-none" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setTestimonials([...testimonials, { name: '', role: '', quote: '' }])}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand">
              <Plus className="h-4 w-4" /> Add Testimonial
            </button>
          </div>
        </SectionModal>
      )}

      {/* ── Management Team Modal ── */}
      {activeSection === 'management' && (
        <SectionModal
          title="Management Team"
          description="Add each team member with their name, role, short bio, and photo path or URL."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('about.management', team)}
          busy={busy === 'save'}
        >
          <div className="space-y-4">
            {team.map((m, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Member {i + 1}</span>
                  <button type="button" onClick={() => setTeam(team.filter((_, j) => j !== i))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input value={m.name} onChange={(e) => { const c = [...team]; c[i] = { ...m, name: e.target.value }; setTeam(c); }}
                    placeholder="Full name" className="input" />
                  <input value={m.role} onChange={(e) => { const c = [...team]; c[i] = { ...m, role: e.target.value }; setTeam(c); }}
                    placeholder="Role (e.g. Provost, Registrar)" className="input" />
                  <textarea value={m.bio} onChange={(e) => { const c = [...team]; c[i] = { ...m, bio: e.target.value }; setTeam(c); }}
                    placeholder="Short bio…" rows={2} className="input resize-none" />
                  <input value={m.photo} onChange={(e) => { const c = [...team]; c[i] = { ...m, photo: e.target.value }; setTeam(c); }}
                    placeholder="Photo path or URL (e.g. /staffs/provost.jpeg)" className="input" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setTeam([...team, { name: '', role: '', bio: '', photo: '' }])}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand">
              <Plus className="h-4 w-4" /> Add Team Member
            </button>
          </div>
        </SectionModal>
      )}

      {/* ── Contact Details Modal ── */}
      {activeSection === 'contact' && (
        <SectionModal
          title="Contact Details"
          description="School contact information displayed in the website footer and on the Contact page."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('contact.info', contact)}
          busy={busy === 'save'}
        >
          <div className="space-y-4">
            <div>
              <label className="label flex items-center gap-2"><MapPin className="h-4 w-4 text-brand" /> Address</label>
              <textarea value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })}
                placeholder="Full school address" rows={3} className="input resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-2"><Phone className="h-4 w-4 text-brand" /> Phone</label>
                <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  placeholder="e.g. 0810 557 6617" className="input" />
              </div>
              <div>
                <label className="label flex items-center gap-2"><Mail className="h-4 w-4 text-brand" /> Email</label>
                <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  placeholder="e.g. info@school.edu" className="input" />
              </div>
            </div>
            <div>
              <label className="label flex items-center gap-2"><Globe className="h-4 w-4 text-brand" /> Office Hours</label>
              <input value={contact.hours} onChange={(e) => setContact({ ...contact, hours: e.target.value })}
                placeholder="e.g. Monday – Friday, 8:00 AM – 4:00 PM" className="input" />
            </div>
          </div>
        </SectionModal>
      )}

      {/* ── Fee Structure Modal ── */}
      {activeSection === 'fees' && (
        <SectionModal
          title="Fee Structure"
          description="Manage fee line items and upload the Schedule of Fees document for the Admission page."
          onClose={() => { setActiveSection(null); setFeeDocFile(null); }}
          onSave={() => saveSection('admission.fees', fees)}
          busy={busy === 'save'}
        >
          <div className="space-y-5">
            {/* Fee line items */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Fee Items</p>
              <div className="space-y-3">
                {fees.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-[3]">
                      <input value={f.item} onChange={(e) => { const c = [...fees]; c[i] = { ...f, item: e.target.value }; setFees(c); }}
                        placeholder="Fee item description" className="input" />
                    </div>
                    <div className="flex-[1]">
                      <input value={f.amount} onChange={(e) => { const c = [...fees]; c[i] = { ...f, amount: e.target.value }; setFees(c); }}
                        placeholder="Amount" className="input text-right font-semibold" />
                    </div>
                    <button type="button" onClick={() => setFees(fees.filter((_, j) => j !== i))}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setFees([...fees, { item: '', amount: '' }])}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand">
                  <Plus className="h-4 w-4" /> Add Fee Item
                </button>
              </div>
            </div>

            {/* Schedule of Fees document upload */}
            <div className="border-t border-gray-200 pt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Schedule of Fees Document</p>
              <p className="mb-3 text-xs text-gray-400">Upload a PDF or image of the full fee schedule. This will be displayed on the Admission page.</p>

              {feeScheduleDoc && (
                <div className="mb-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <FileText className="h-5 w-5 shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{feeScheduleDoc.name}</p>
                  </div>
                  <a href={feeScheduleDoc.url} target="_blank" rel="noopener noreferrer"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-gray-400 hover:text-brand">
                    <Download className="h-4 w-4" />
                  </a>
                  <button type="button" onClick={removeFeeScheduleDoc} disabled={busy === 'delete'}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                    {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setFeeDocFile(e.target.files?.[0] ?? null)}
                  className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark" />
                <button type="button" onClick={uploadFeeScheduleDoc} disabled={!feeDocFile || feeDocUploading}
                  className="btn-secondary shrink-0 disabled:opacity-50">
                  {feeDocUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload
                </button>
              </div>
              {feeDocFile && <p className="mt-1 text-xs text-gray-400">{feeDocFile.name}</p>}
            </div>
          </div>
        </SectionModal>
      )}

      {/* ── About Pillars Modal ── */}
      {activeSection === 'pillars' && (
        <SectionModal
          title="About Page Pillars"
          description="Edit the text for each of the four pillar cards on the About page."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('about.pillars', pillars)}
          busy={busy === 'save'}
        >
          <div className="space-y-4">
            <div>
              <label className="label">Our Pledge</label>
              <textarea value={pillars.pledge} onChange={(e) => setPillars({ ...pillars, pledge: e.target.value })}
                rows={3} placeholder="We acknowledge the importance of primary health…" className="input resize-none" />
            </div>
            <div>
              <label className="label">Our Vision</label>
              <textarea value={pillars.vision} onChange={(e) => setPillars({ ...pillars, vision: e.target.value })}
                rows={3} placeholder="To bridge the gap and create access to health knowledge…" className="input resize-none" />
            </div>
            <div>
              <label className="label">Our Mission</label>
              <textarea value={pillars.mission} onChange={(e) => setPillars({ ...pillars, mission: e.target.value })}
                rows={3} placeholder="To train and produce persons who are equipped…" className="input resize-none" />
            </div>
            <div>
              <label className="label">Accreditation</label>
              <textarea value={pillars.accreditation} onChange={(e) => setPillars({ ...pillars, accreditation: e.target.value })}
                rows={3} placeholder="Our programmes are examined and certified by…" className="input resize-none" />
            </div>
          </div>
        </SectionModal>
      )}

      {/* ── Certificates Modal ── */}
      {activeSection === 'certificates' && (
        <SectionModal
          title="Certifications & Licences"
          description="Add each certificate with its image (uploaded from your device or pasted URL), title and issuer description."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('about.certificates', certificates)}
          busy={busy === 'save'}
        >
          <div className="space-y-4">
            {certificates.map((c, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Certificate {i + 1}</span>
                  <button type="button" onClick={() => setCertificates(certificates.filter((_, j) => j !== i))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input value={c.title} onChange={(e) => { const copy = [...certificates]; copy[i] = { ...c, title: e.target.value }; setCertificates(copy); }}
                    placeholder="Certificate title" className="input" />
                  <div>
                    <label className="label">Certificate Image</label>
                    <div className="flex items-center gap-2">
                      <input value={c.image} onChange={(e) => { const copy = [...certificates]; copy[i] = { ...c, image: e.target.value }; setCertificates(copy); }}
                        placeholder="Image URL (upload below or paste URL)" className="input flex-1" />
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white hover:bg-brand-dark">
                        <Upload className="h-3.5 w-3.5" /> Upload
                        <input type="file" accept="image/*" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setCertUploading(true);
                            try {
                              const result = await cmsApi.uploadMedia(file);
                              const copy = [...certificates]; copy[i] = { ...c, image: result.url }; setCertificates(copy);
                            } catch { setError('Failed to upload image.'); }
                            finally { setCertUploading(false); e.target.value = ''; }
                          }} />
                      </label>
                    </div>
                    {certUploading && <p className="mt-1 text-xs text-brand">Uploading to Cloudinary…</p>}
                    {c.image && <img src={c.image} alt={c.title} className="mt-2 h-20 w-auto rounded border border-gray-200 object-contain" />}
                  </div>
                  <textarea value={c.issuer} onChange={(e) => { const copy = [...certificates]; copy[i] = { ...c, issuer: e.target.value }; setCertificates(copy); }}
                    placeholder="Issuer / description" rows={2} className="input resize-none" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setCertificates([...certificates, { title: '', image: '', issuer: '' }])}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand">
              <Plus className="h-4 w-4" /> Add Certificate
            </button>
          </div>
        </SectionModal>
      )}

      {/* ── Core Values Modal ── */}
      {activeSection === 'coreValues' && (
        <SectionModal
          title="Core Values"
          description="Add or remove the values displayed in the gradient strip on the About page."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('about.coreValues', coreValues)}
          busy={busy === 'save'}
        >
          <div className="space-y-3">
            {coreValues.map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <input value={v} onChange={(e) => { const copy = [...coreValues]; copy[i] = e.target.value; setCoreValues(copy); }}
                  placeholder="e.g. Excellence" className="input flex-1" />
                <button type="button" onClick={() => setCoreValues(coreValues.filter((_, j) => j !== i))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setCoreValues([...coreValues, ''])}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand">
              <Plus className="h-4 w-4" /> Add Value
            </button>
          </div>
        </SectionModal>
      )}

      {/* ── Alumni Stories Modal ── */}
      {activeSection === 'alumni' && (
        <SectionModal
          title="Alumni Success Stories"
          description="Each story has a name, graduation year, programme, current role, and their story."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('alumni.stories', alumniStories)}
          busy={busy === 'save'}
        >
          <div className="space-y-4">
            {alumniStories.map((s, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Story {i + 1}</span>
                  <button type="button" onClick={() => setAlumniStories(alumniStories.filter((_, j) => j !== i))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input value={s.name} onChange={(e) => { const c = [...alumniStories]; c[i] = { ...s, name: e.target.value }; setAlumniStories(c); }}
                    placeholder="Full name" className="input" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={s.graduationYear} onChange={(e) => { const c = [...alumniStories]; c[i] = { ...s, graduationYear: e.target.value }; setAlumniStories(c); }}
                      placeholder="Graduation year (e.g. 2020)" className="input" />
                    <input value={s.programme} onChange={(e) => { const c = [...alumniStories]; c[i] = { ...s, programme: e.target.value }; setAlumniStories(c); }}
                      placeholder="Programme (e.g. ND Community Health)" className="input" />
                  </div>
                  <input value={s.currentRole} onChange={(e) => { const c = [...alumniStories]; c[i] = { ...s, currentRole: e.target.value }; setAlumniStories(c); }}
                    placeholder="Current role / position" className="input" />
                  <textarea value={s.story} onChange={(e) => { const c = [...alumniStories]; c[i] = { ...s, story: e.target.value }; setAlumniStories(c); }}
                    placeholder="Their success story…" rows={3} className="input resize-none" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setAlumniStories([...alumniStories, { name: '', graduationYear: '', programme: '', currentRole: '', story: '' }])}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand">
              <Plus className="h-4 w-4" /> Add Story
            </button>
          </div>
        </SectionModal>
      )}

      {/* ── Admission Requirements Modal ── */}
      {activeSection === 'admissionReqs' && (
        <SectionModal
          title="Admission Requirements"
          description="Each requirement has a title and description. Displayed as cards on the Admission page."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('admission.requirements', admissionReqs)}
          busy={busy === 'save'}
        >
          <div className="space-y-4">
            {admissionReqs.map((r, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Requirement {i + 1}</span>
                  <button type="button" onClick={() => setAdmissionReqs(admissionReqs.filter((_, j) => j !== i))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input value={r.title} onChange={(e) => { const c = [...admissionReqs]; c[i] = { ...r, title: e.target.value }; setAdmissionReqs(c); }}
                    placeholder="Requirement title" className="input" />
                  <textarea value={r.body} onChange={(e) => { const c = [...admissionReqs]; c[i] = { ...r, body: e.target.value }; setAdmissionReqs(c); }}
                    placeholder="Description…" rows={3} className="input resize-none" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setAdmissionReqs([...admissionReqs, { title: '', body: '' }])}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand">
              <Plus className="h-4 w-4" /> Add Requirement
            </button>
          </div>
        </SectionModal>
      )}

      {/* ── Admission Programmes Modal ── */}
      {activeSection === 'admissionProgrammes' && (
        <SectionModal
          title="Programmes of Interest"
          description="Each programme has a name and duration. Displayed as options in the Admission page application form."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('admission.programmes', admissionProgrammes)}
          busy={busy === 'save'}
        >
          <div className="space-y-3">
            {admissionProgrammes.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-[3]">
                  <input value={p.name} onChange={(e) => { const c = [...admissionProgrammes]; c[i] = { ...p, name: e.target.value }; setAdmissionProgrammes(c); }}
                    placeholder="Programme name" className="input" />
                </div>
                <div className="flex-[1]">
                  <input value={p.duration} onChange={(e) => { const c = [...admissionProgrammes]; c[i] = { ...p, duration: e.target.value }; setAdmissionProgrammes(c); }}
                    placeholder="Duration" className="input" />
                </div>
                <button type="button" onClick={() => setAdmissionProgrammes(admissionProgrammes.filter((_, j) => j !== i))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setAdmissionProgrammes([...admissionProgrammes, { name: '', duration: '' }])}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand">
              <Plus className="h-4 w-4" /> Add Programme
            </button>
          </div>
        </SectionModal>
      )}

      {/* ── Academics Note Modal ── */}
      {activeSection === 'academicsNote' && (
        <SectionModal
          title="Academics — Learning Pathways Note"
          description="This text is displayed in the highlighted note at the bottom of the Academics page."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('academics.note', academicsNote)}
          busy={busy === 'save'}
        >
          <div>
            <label className="label">Note text</label>
            <textarea value={academicsNote} onChange={(e) => setAcademicsNote(e.target.value)}
              rows={4} placeholder="Most undergraduate programmes run on a two-semester academic calendar…" className="input resize-none" />
          </div>
        </SectionModal>
      )}

      {/* ── Hero Slider Modal ── */}
      {activeSection === 'hero' && (
        <SectionModal
          title="Hero Slider"
          description="Add, edit or remove slides for the homepage hero banner. Upload an image for each slide and configure its text and call-to-action."
          onClose={() => setActiveSection(null)}
          onSave={() => saveSection('hero.slides', heroSlides)}
          busy={busy === 'save'}
        >
          <div className="space-y-4">
            {heroSlides.map((s, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Slide {i + 1}</span>
                  <div className="flex items-center gap-1">
                    {i > 0 && (
                      <button type="button" onClick={() => {
                        const copy = [...heroSlides];
                        [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                        setHeroSlides(copy);
                      }} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Move up">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {i < heroSlides.length - 1 && (
                      <button type="button" onClick={() => {
                        const copy = [...heroSlides];
                        [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
                        setHeroSlides(copy);
                      }} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Move down">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button type="button" onClick={() => setHeroSlides(heroSlides.filter((_, j) => j !== i))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="label">Slide Image</label>
                    <div className="flex items-center gap-2">
                      <input value={s.image} onChange={(e) => { const copy = [...heroSlides]; copy[i] = { ...s, image: e.target.value }; setHeroSlides(copy); }}
                        placeholder="Image URL (upload below or paste URL)" className="input flex-1" />
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white hover:bg-brand-dark">
                        <Upload className="h-3.5 w-3.5" /> Upload
                        <input type="file" accept="image/*" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setHeroUploading(true);
                            try {
                              const result = await cmsApi.uploadMedia(file);
                              const copy = [...heroSlides]; copy[i] = { ...s, image: result.url }; setHeroSlides(copy);
                            } catch { setError('Failed to upload image.'); }
                            finally { setHeroUploading(false); e.target.value = ''; }
                          }} />
                      </label>
                    </div>
                    {heroUploading && <p className="mt-1 text-xs text-brand">Uploading to Cloudinary…</p>}
                    {s.image && <img src={s.image} alt={s.eyebrow} className="mt-2 h-20 w-auto rounded border border-gray-200 object-contain" />}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Eyebrow Tag</label>
                      <input value={s.eyebrow} onChange={(e) => { const copy = [...heroSlides]; copy[i] = { ...s, eyebrow: e.target.value }; setHeroSlides(copy); }}
                        placeholder="e.g. Welcome" className="input" />
                    </div>
                    <div>
                      <label className="label">CTA Link</label>
                      <select value={s.ctaHref} onChange={(e) => { const copy = [...heroSlides]; copy[i] = { ...s, ctaHref: e.target.value }; setHeroSlides(copy); }}
                        className="input">
                        <option value="">Select a page…</option>
                        <option value="/">Home</option>
                        <option value="/about">About</option>
                        <option value="/academics">Academics</option>
                        <option value="/admission">Admission</option>
                        <option value="/alumni">Alumni</option>
                        <option value="/contact">Contact</option>
                        <option value="/events">Events</option>
                        <option value="/gallery">Gallery</option>
                        <option value="/news">News</option>
                        <option value="/staff">Staff</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Title</label>
                    <input value={s.title} onChange={(e) => { const copy = [...heroSlides]; copy[i] = { ...s, title: e.target.value }; setHeroSlides(copy); }}
                      placeholder="Slide heading" className="input" />
                  </div>
                  <div>
                    <label className="label">Subtitle</label>
                    <textarea value={s.subtitle} onChange={(e) => { const copy = [...heroSlides]; copy[i] = { ...s, subtitle: e.target.value }; setHeroSlides(copy); }}
                      placeholder="Brief description text" rows={2} className="input resize-none" />
                  </div>
                  <div>
                    <label className="label">CTA Button Label</label>
                    <input value={s.ctaLabel} onChange={(e) => { const copy = [...heroSlides]; copy[i] = { ...s, ctaLabel: e.target.value }; setHeroSlides(copy); }}
                      placeholder="e.g. Apply Now" className="input" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setHeroSlides([...heroSlides, { image: '', eyebrow: '', title: '', subtitle: '', ctaLabel: '', ctaHref: '' }])}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand">
              <Plus className="h-4 w-4" /> Add Slide
            </button>
          </div>
        </SectionModal>
      )}

      {/* ── Gallery Add Modal ── */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">Add Gallery Media</h3>
              <button type="button" onClick={() => { setGalleryOpen(false); resetGalleryForm(); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddMedia} className="space-y-4 px-6 py-5">
              <div className="flex rounded-lg border border-gray-200 p-0.5">
                <button type="button" onClick={() => setUploadMode('file')}
                  className={cn('flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition',
                    uploadMode === 'file' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900')}>Upload File</button>
                <button type="button" onClick={() => setUploadMode('url')}
                  className={cn('flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition',
                    uploadMode === 'url' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900')}>Paste URL</button>
              </div>
              {uploadMode === 'file' ? (
                <div>
                  <label className="label">Image or Video File</label>
                  <input ref={fileInputRef} key={fileKey} type="file" accept="image/*,video/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark" />
                  <p className="mt-1 text-xs text-gray-400">{uploadFile ? uploadFile.name : 'Select a file to upload (max 10MB).'}</p>
                  {uploading && <p className="mt-1 text-xs text-brand">Uploading…</p>}
                </div>
              ) : (
                <div>
                  <label className="label">Media URL</label>
                  <input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" className="input" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="input">
                    <option value="IMAGE">Image</option><option value="VIDEO">Video</option>
                  </select>
                </div>
                <div>
                  <label className="label">Album (optional)</label>
                  <input value={mediaAlbum} onChange={(e) => setMediaAlbum(e.target.value)} placeholder="e.g. Convocation 2026" className="input" />
                </div>
              </div>
              <div>
                <label className="label">Caption (optional)</label>
                <input value={mediaCaption} onChange={(e) => setMediaCaption(e.target.value)} placeholder="Short description…" className="input" />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => { setGalleryOpen(false); resetGalleryForm(); }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={busy === 'add-media' || uploading} className="btn-primary disabled:opacity-60">
                  <Plus className="h-4 w-4" />
                  {uploading ? 'Uploading…' : busy === 'add-media' ? 'Adding…' : 'Add to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Image lightbox ── */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setLightboxItem(null)}>
          <button type="button" onClick={() => setLightboxItem(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <div className="relative max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxItem.url} alt={lightboxItem.caption ?? 'Gallery image'} className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl" />
            {(lightboxItem.caption || lightboxItem.album) && (
              <div className="absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-black/70 to-transparent px-5 py-4 pt-10">
                {lightboxItem.album && <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">{lightboxItem.album}</span>}
                {lightboxItem.caption && <p className="text-sm font-medium text-white">{lightboxItem.caption}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Gallery Item Modal ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">Edit Gallery Item</h3>
              <button type="button" onClick={() => setEditingItem(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateGallery} className="space-y-4 px-6 py-5">
              <div>
                <label className="label">Media URL</label>
                <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://…" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select value={editType} onChange={(e) => setEditType(e.target.value)} className="input">
                    <option value="IMAGE">Image</option><option value="VIDEO">Video</option>
                  </select>
                </div>
                <div>
                  <label className="label">Album (optional)</label>
                  <input value={editAlbum} onChange={(e) => setEditAlbum(e.target.value)} placeholder="e.g. Convocation 2026" className="input" />
                </div>
              </div>
              <div>
                <label className="label">Caption (optional)</label>
                <input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} placeholder="Short description…" className="input" />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={busy === 'update-gallery'} className="btn-primary disabled:opacity-60">
                  {busy === 'update-gallery' ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Gallery Item Confirmation ── */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-center text-base font-semibold text-gray-900">Delete Gallery Item</h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              Are you sure you want to delete &quot;{deletingItem.caption || 'this item'}&quot;? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={() => setDeletingItem(null)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={handleDeleteGallery} disabled={busy === 'delete-gallery'}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
                {busy === 'delete-gallery' ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Shared modal wrapper for content section editors
   ══════════════════════════════════════════════════════════════════════════ */
function SectionModal({ title, description, children, onClose, onSave, busy }: {
  title: string; description: string; children: React.ReactNode;
  onClose: () => void; onSave: () => void; busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <button type="button" onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
        <div className="px-6 py-5">
          {children}
          <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="button" onClick={onSave} disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
