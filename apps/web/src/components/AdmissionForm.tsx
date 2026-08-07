"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  admissionsApi,
  ApiError,
  type ApplyResult,
  type TrackResult,
  type WebsiteContentRecord,
} from "@/lib/api";
import { asArray, getBlockBody } from "@/lib/content";

/* ─── helpers ─── */
const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";
const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";
const sectionCls = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted — under review",
  UNDER_REVIEW: "Under review",
  INTERVIEW: "Interview scheduled",
  APPROVED: "Approved — pay acceptance fee",
  REJECTED: "Not successful",
  ADMITTED: "Admitted",
};

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];

const DOC_TYPES = [
  { key: "PASSPORT_PHOTO", label: "Passport Photographs (2)" },
  { key: "BIRTH_CERTIFICATE", label: "Birth Certificate / Declaration of Age" },
  { key: "CERTIFICATE", label: "Photocopies of Educational Certificates" },
  { key: "TESTIMONIAL", label: "Testimonial from Last Institution" },
  { key: "GOOD_CONDUCT", label: "Letter of Good Conduct" },
  { key: "INGENIUNE_FORM", label: "Local Government Indigene Form" },
  { key: "NAME_CHANGE", label: "Evidence of Change of Name (if applicable)" },
] as const;

const defaultProgrammes = [
  { name: "National Diploma in Community Health (CHEW)", duration: "3 Years" },
  { name: "National Diploma in Medical Lab Technician (MLT)", duration: "3 Years" },
  { name: "National Diploma in Public Health (PH)", duration: "3 Years" },
  { name: "National Diploma in Pharmacy Technician (PT)", duration: "3 Years" },
];

interface ProgrammeOption { name: string; duration: string }

function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts[parts.length - 1] : "",
    middleName: parts.slice(1, -1).join(" ") || undefined,
  };
}

/* ─── component ─── */
export default function AdmissionForm({ blocks }: { blocks?: WebsiteContentRecord[] }) {
  const programmes: ProgrammeOption[] = (() => {
    if (blocks) {
      const cms = asArray(getBlockBody(blocks, "admission.programmes"));
      if (cms.length > 0) return cms as ProgrammeOption[];
    }
    return defaultProgrammes;
  })();

  // Personal info
  const [surname, setSurname] = useState("");
  const [otherNames, setOtherNames] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [stateOfOrigin, setStateOfOrigin] = useState("");
  const [localGovt, setLocalGovt] = useState("");
  const [gsm, setGsm] = useState("");
  const [postalAddr, setPostalAddr] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [homeAddr, setHomeAddr] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianGsm, setGuardianGsm] = useState("");
  const [email, setEmail] = useState("");

  // Programme choices
  const [firstChoice, setFirstChoice] = useState("");
  const [secondChoice, setSecondChoice] = useState("");
  const [thirdChoice, setThirdChoice] = useState("");

  // Dynamic tables
  const [schools, setSchools] = useState([{ schoolName: "", from: "", to: "", certificate: "" }]);
  const [olevel, setOlevel] = useState([{ examination: "WAEC", centreNo: "", subject: "", grade: "", year: "" }]);
  const [alevel, setAlevel] = useState([{ institution: "", from: "", to: "", programme: "", qualification: "" }]);
  const [employment, setEmployment] = useState([{ employer: "", position: "", from: "", to: "" }]);

  // Documents
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});

  // Declaration
  const [declaredAgreed, setDeclaredAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [declDate, setDeclDate] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  // Tracking
  const [trackNo, setTrackNo] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<TrackResult | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  /* ── dynamic table helpers ── */
  function addRow<T>(arr: T[], setter: (v: T[]) => void, empty: T) {
    setter([...arr, empty]);
  }
  function removeRow<T>(arr: T[], setter: (v: T[]) => void, idx: number) {
    setter(arr.filter((_, i) => i !== idx));
  }
  function updateRow<T extends Record<string, string>>(arr: T[], setter: (v: T[]) => void, idx: number, key: keyof T, val: string) {
    const c = [...arr]; c[idx] = { ...c[idx], [key]: val }; setter(c);
  }

  /* ── submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!declaredAgreed) { setError("You must agree to the declaration before submitting."); return; }
    setSubmitting(true); setError(null);

    try {
      const names = splitName(`${surname} ${otherNames}`);
      const res = await admissionsApi.apply({
        schoolSlug: "goinze-demo",
        firstName: names.firstName,
        lastName: names.lastName,
        middleName: names.middleName,
        email,
        phone: gsm,
        gender: sex === "Male" ? "MALE" : sex === "Female" ? "FEMALE" : undefined,
        dateOfBirth: dob || undefined,
        maritalStatus: maritalStatus || undefined,
        stateOfOrigin: stateOfOrigin || undefined,
        localGovernment: localGovt || undefined,
        postalAddress: postalAddr || undefined,
        homeAddress: homeAddr || undefined,
        guardianName: guardianName || undefined,
        guardianGsm: guardianGsm || undefined,
        medicalHistory: medicalHistory || undefined,
        firstChoice: firstChoice || undefined,
        secondChoice: secondChoice || undefined,
        thirdChoice: thirdChoice || undefined,
        educationData: {
          schools: schools.filter(s => s.schoolName),
          olevelResults: olevel.filter(r => r.subject),
          alevelResults: alevel.filter(r => r.institution),
          employmentRecords: employment.filter(r => r.employer),
        },
        declarationName: signatureName || undefined,
        declarationDate: declDate || undefined,
        declarationAgreed: true,
      });

      // Upload documents after application is created
      const docs = Object.entries(docFiles).filter(([, f]) => f != null);
      if (docs.length > 0) {
        for (const [type, file] of docs) {
          setUploadProgress(`Uploading ${DOC_TYPES.find(d => d.key === type)?.label ?? type}…`);
          await admissionsApi.uploadDocument(res.id, file!, type);
        }
        setUploadProgress("");
      }

      setResult(res);
      setTrackNo(res.applicationNo);
      setTrackEmail(email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setTracking(true); setTrackError(null); setTrackResult(null);
    try {
      const res = await admissionsApi.track(trackNo, trackEmail);
      setTrackResult(res);
    } catch (err) {
      setTrackError(err instanceof ApiError ? err.message : "Unable to look up that application.");
    } finally { setTracking(false); }
  }

  function resetForm() {
    setResult(null); setSurname(""); setOtherNames(""); setDob(""); setSex("");
    setMaritalStatus(""); setStateOfOrigin(""); setLocalGovt(""); setGsm("");
    setPostalAddr(""); setMedicalHistory(""); setHomeAddr(""); setGuardianName("");
    setGuardianGsm(""); setEmail(""); setFirstChoice(""); setSecondChoice("");
    setThirdChoice(""); setSchools([{ schoolName: "", from: "", to: "", certificate: "" }]);
    setOlevel([{ examination: "WAEC", centreNo: "", subject: "", grade: "", year: "" }]);
    setAlevel([{ institution: "", from: "", to: "", programme: "", qualification: "" }]);
    setEmployment([{ employer: "", position: "", from: "", to: "" }]);
    setDocFiles({}); setDeclaredAgreed(false); setSignatureName(""); setDeclDate("");
    setError(null);
  }

  /* ─── render ─── */
  return (
    <div className="space-y-10">
      {result ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
          <h3 className="mt-4 text-xl font-bold text-slate-900">Application received!</h3>
          <p className="mt-2 text-sm text-slate-600">
            Thank you for applying to {result.schoolName}. Save your application number — you&apos;ll need it to track your status.
          </p>
          <div className="mx-auto mt-5 inline-block rounded-lg border border-blue-200 bg-white px-6 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Application Number</p>
            <p className="font-mono text-lg font-bold text-brand">{result.applicationNo}</p>
          </div>
          <div className="mt-6">
            <button onClick={resetForm} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark">
              Submit another application
            </button>
          </div>
        </div>
      ) : (
        <form ref={formRef} className="space-y-8" onSubmit={handleSubmit}>
          {/* ── Section 1: Personal Information ── */}
          <div className={sectionCls}>
            <h3 className="mb-5 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Personal Information</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><label className={labelCls}>Surname *</label><input type="text" required value={surname} onChange={e => setSurname(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Other Names *</label><input type="text" required value={otherNames} onChange={e => setOtherNames(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Date of Birth *</label><input type="date" required value={dob} onChange={e => setDob(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Sex *</label>
                <select required value={sex} onChange={e => setSex(e.target.value)} className={inputCls}><option value="" disabled>Select…</option><option>Male</option><option>Female</option></select>
              </div>
              <div><label className={labelCls}>Marital Status</label>
                <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className={inputCls}><option value="">Select…</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select>
              </div>
              <div><label className={labelCls}>State of Origin</label>
                <select value={stateOfOrigin} onChange={e => setStateOfOrigin(e.target.value)} className={inputCls}><option value="">Select…</option>{NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}</select>
              </div>
              <div><label className={labelCls}>Local Government</label><input type="text" value={localGovt} onChange={e => setLocalGovt(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>GSM Number *</label><input type="tel" required value={gsm} onChange={e => setGsm(e.target.value)} placeholder="0810 557 6612" className={inputCls} /></div>
              <div><label className={labelCls}>Email Address *</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Postal Address</label><input type="text" value={postalAddr} onChange={e => setPostalAddr(e.target.value)} className={inputCls} /></div>
              <div className="sm:col-span-2 lg:col-span-3"><label className={labelCls}>Medical History (if any)</label><textarea value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} rows={2} className={inputCls + " resize-none"} placeholder="Any known medical conditions, allergies, etc." /></div>
              <div className="sm:col-span-2 lg:col-span-3"><label className={labelCls}>Permanent Home Address (if different)</label><input type="text" value={homeAddr} onChange={e => setHomeAddr(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Guardian/Sponsor Name</label><input type="text" value={guardianName} onChange={e => setGuardianName(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Guardian/Sponsor GSM</label><input type="tel" value={guardianGsm} onChange={e => setGuardianGsm(e.target.value)} className={inputCls} /></div>
            </div>
          </div>

          {/* ── Section 2: Programme Choices ── */}
          <div className={sectionCls}>
            <h3 className="mb-5 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Programme (Course of Study)</h3>
            <p className="mb-4 text-xs text-slate-500">Please refer to the school brochure for your course of study.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className={labelCls}>First Choice</label>
                <select value={firstChoice} onChange={e => setFirstChoice(e.target.value)} className={inputCls}><option value="">Select…</option>{programmes.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}</select>
              </div>
              <div><label className={labelCls}>Second Choice</label>
                <select value={secondChoice} onChange={e => setSecondChoice(e.target.value)} className={inputCls}><option value="">Select…</option>{programmes.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}</select>
              </div>
              <div><label className={labelCls}>Third Choice</label>
                <select value={thirdChoice} onChange={e => setThirdChoice(e.target.value)} className={inputCls}><option value="">Select…</option>{programmes.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}</select>
              </div>
            </div>
          </div>

          {/* ── Section 3: Schools Attended ── */}
          <div className={sectionCls}>
            <h3 className="mb-5 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Schools Attended (Primary & Post-Primary)</h3>
            <div className="space-y-3">
              {schools.map((s, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_2fr_auto] items-end">
                  <div><label className={labelCls}>School Name</label><input value={s.schoolName} onChange={e => updateRow(schools, setSchools, i, "schoolName", e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>From</label><input value={s.from} onChange={e => updateRow(schools, setSchools, i, "from", e.target.value)} placeholder="Year" className={inputCls} /></div>
                  <div><label className={labelCls}>To</label><input value={s.to} onChange={e => updateRow(schools, setSchools, i, "to", e.target.value)} placeholder="Year" className={inputCls} /></div>
                  <div><label className={labelCls}>Certificate Obtained</label><input value={s.certificate} onChange={e => updateRow(schools, setSchools, i, "certificate", e.target.value)} className={inputCls} /></div>
                  <button type="button" onClick={() => removeRow(schools, setSchools, i)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => addRow(schools, setSchools, { schoolName: "", from: "", to: "", certificate: "" })} className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"><Plus className="h-4 w-4" /> Add School</button>
            </div>
          </div>

          {/* ── Section 4: O' Level Results ── */}
          <div className={sectionCls}>
            <h3 className="mb-5 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">O&apos; Level Results</h3>
            <div className="space-y-3">
              {olevel.map((r, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1.5fr_1fr_1.5fr_1fr_1fr_auto] items-end">
                  <div><label className={labelCls}>Examination</label>
                    <select value={r.examination} onChange={e => updateRow(olevel, setOlevel, i, "examination", e.target.value)} className={inputCls}><option>WAEC</option><option>NECO</option><option>NABTEB</option></select>
                  </div>
                  <div><label className={labelCls}>Centre No.</label><input value={r.centreNo} onChange={e => updateRow(olevel, setOlevel, i, "centreNo", e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Subject</label><input value={r.subject} onChange={e => updateRow(olevel, setOlevel, i, "subject", e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Grade</label>
                    <select value={r.grade} onChange={e => updateRow(olevel, setOlevel, i, "grade", e.target.value)} className={inputCls}><option value="">Select</option>{["A1","B2","B3","C4","C5","C6","D7","E8","F9"].map(g => <option key={g}>{g}</option>)}</select>
                  </div>
                  <div><label className={labelCls}>Year</label><input value={r.year} onChange={e => updateRow(olevel, setOlevel, i, "year", e.target.value)} placeholder="YYYY" className={inputCls} /></div>
                  <button type="button" onClick={() => removeRow(olevel, setOlevel, i)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => addRow(olevel, setOlevel, { examination: "WAEC", centreNo: "", subject: "", grade: "", year: "" })} className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"><Plus className="h-4 w-4" /> Add Result</button>
            </div>
          </div>

          {/* ── Section 5: A' Level Results ── */}
          <div className={sectionCls}>
            <h3 className="mb-5 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">A&apos; Level Results</h3>
            <div className="space-y-3">
              {alevel.map((r, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_2fr_2fr_auto] items-end">
                  <div><label className={labelCls}>Institution</label><input value={r.institution} onChange={e => updateRow(alevel, setAlevel, i, "institution", e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>From</label><input value={r.from} onChange={e => updateRow(alevel, setAlevel, i, "from", e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>To</label><input value={r.to} onChange={e => updateRow(alevel, setAlevel, i, "to", e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Programme/Course</label><input value={r.programme} onChange={e => updateRow(alevel, setAlevel, i, "programme", e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Qualification</label><input value={r.qualification} onChange={e => updateRow(alevel, setAlevel, i, "qualification", e.target.value)} className={inputCls} /></div>
                  <button type="button" onClick={() => removeRow(alevel, setAlevel, i)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => addRow(alevel, setAlevel, { institution: "", from: "", to: "", programme: "", qualification: "" })} className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"><Plus className="h-4 w-4" /> Add Entry</button>
            </div>
          </div>

          {/* ── Section 6: Employment Records ── */}
          <div className={sectionCls}>
            <h3 className="mb-5 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Employment Records <span className="text-xs font-normal text-slate-400">(if any)</span></h3>
            <div className="space-y-3">
              {employment.map((r, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[2fr_2fr_1fr_1fr_auto] items-end">
                  <div><label className={labelCls}>Employer</label><input value={r.employer} onChange={e => updateRow(employment, setEmployment, i, "employer", e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Position</label><input value={r.position} onChange={e => updateRow(employment, setEmployment, i, "position", e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>From</label><input value={r.from} onChange={e => updateRow(employment, setEmployment, i, "from", e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>To</label><input value={r.to} onChange={e => updateRow(employment, setEmployment, i, "to", e.target.value)} className={inputCls} /></div>
                  <button type="button" onClick={() => removeRow(employment, setEmployment, i)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => addRow(employment, setEmployment, { employer: "", position: "", from: "", to: "" })} className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"><Plus className="h-4 w-4" /> Add Record</button>
            </div>
          </div>

          {/* ── Section 7: Document Uploads ── */}
          <div className={sectionCls}>
            <h3 className="mb-2 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Supporting Documents</h3>
            <p className="mb-4 text-xs text-slate-500">Upload any available documents. All uploads are optional — you can submit your application without them.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {DOC_TYPES.map(dt => (
                <label key={dt.key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 transition-colors hover:border-brand hover:bg-blue-50">
                  {docFiles[dt.key] ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <Upload className="h-5 w-5 shrink-0 text-brand" />
                  )}
                  <span className="flex-1 text-sm text-slate-600">
                    {docFiles[dt.key] ? docFiles[dt.key]!.name : dt.label}
                  </span>
                  {docFiles[dt.key] && (
                    <button type="button" onClick={(e) => { e.preventDefault(); setDocFiles(prev => { const c = { ...prev }; delete c[dt.key]; return c; }); }}
                      className="flex h-6 w-6 items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => { if (e.target.files?.[0]) setDocFiles(prev => ({ ...prev, [dt.key]: e.target.files![0] })); }} />
                </label>
              ))}
            </div>
          </div>

          {/* ── Section 8: Declaration ── */}
          <div className={sectionCls}>
            <h3 className="mb-5 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Declaration</h3>
            <p className="mb-4 text-sm leading-relaxed text-slate-600">
              I certify that the particulars and the information given on this form are to the best of my knowledge correct. If any time, the institution is reasonably satisfied that any of the information I have given on this form is false or incorrect, I will be required to withdraw from the programme or be liable to prosecution or both.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelCls}>Signature of Applicant (Full Name) *</label><input type="text" required value={signatureName} onChange={e => setSignatureName(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Date *</label><input type="date" required value={declDate} onChange={e => setDeclDate(e.target.value)} className={inputCls} /></div>
            </div>
            <label className="mt-4 flex items-start gap-3">
              <input type="checkbox" checked={declaredAgreed} onChange={e => setDeclaredAgreed(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
              <span className="text-sm text-slate-600">I agree to the declaration above and confirm that all information provided is true and accurate.</span>
            </label>
          </div>

          {/* ── Error / Submit ── */}
          {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p>}
          {uploadProgress && <p className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700"><Loader2 className="h-4 w-4 animate-spin" />{uploadProgress}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Your application is submitted securely to the admissions office.</p>
            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </form>
      )}

      {/* ── Status Tracking ── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Search className="h-4 w-4 text-brand" /> Track your application
        </h3>
        <p className="mt-1 text-sm text-slate-500">Enter your application number and the email you applied with.</p>
        <form onSubmit={handleTrack} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input value={trackNo} onChange={e => setTrackNo(e.target.value)} required placeholder="Application number" className={inputCls} />
          <input type="email" value={trackEmail} onChange={e => setTrackEmail(e.target.value)} required placeholder="Email used to apply" className={inputCls} />
          <button type="submit" disabled={tracking} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60">
            {tracking && <Loader2 className="h-4 w-4 animate-spin" />} Track
          </button>
        </form>
        {trackError && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{trackError}</p>}
        {trackResult && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">{trackResult.applicantName}</p>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand">{STATUS_LABEL[trackResult.status] ?? trackResult.status}</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-400">Application No.</dt><dd className="font-mono text-slate-800">{trackResult.applicationNo}</dd></div>
              <div><dt className="text-slate-400">Acceptance Fee</dt><dd className="text-slate-800">{trackResult.acceptanceFeePaid ? "Paid" : "Not paid"}</dd></div>
              {trackResult.student?.matricNumber && <div><dt className="text-slate-400">Matric Number</dt><dd className="font-mono text-slate-800">{trackResult.student.matricNumber}</dd></div>}
            </dl>
            {trackResult.admissionLetterUrl && <a href={trackResult.admissionLetterUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">View admission letter</a>}
          </div>
        )}
      </div>
    </div>
  );
}
