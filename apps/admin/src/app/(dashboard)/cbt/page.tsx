'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  Database,
  Download,
  FileQuestion,
  ListChecks,
  Loader2,
  Plus,
  Square,
  Upload,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import {
  academicsApi,
  cbtApi,
  sessionsApi,
  type AcademicSessionRecord,
  type CbtAttemptRecord,
  type CbtBankRecord,
  type CbtExamRecord,
  type CbtExamStatus,
  type CbtQuestionRecord,
  type CourseRecord,
  type ExamAccessCodeRecord,
} from '@/lib/api';

type Tab = 'exams' | 'banks';

const QUESTION_TYPES = ['OBJECTIVE', 'MULTI_SELECT', 'TRUE_FALSE', 'ESSAY', 'FILL_BLANK'];

function hasOptions(type: string): boolean {
  return type === 'OBJECTIVE' || type === 'MULTI_SELECT' || type === 'TRUE_FALSE';
}

function typeLabel(type: string): string {
  return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatWhen(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const EMPTY_OPTIONS = () =>
  Array.from({ length: 4 }, () => ({ text: '', isCorrect: false }));

export default function CbtPage() {
  const [tab, setTab] = useState<Tab>('exams');

  const [exams, setExams] = useState<CbtExamRecord[]>([]);
  const [banks, setBanks] = useState<CbtBankRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Create-exam modal
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [duration, setDuration] = useState(60);
  const [passMark, setPassMark] = useState(40);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [instructions, setInstructions] = useState('');
  const [shuffle, setShuffle] = useState(true);
  const [browserLock, setBrowserLock] = useState(false);

  // Add-questions modal
  const [addFor, setAddFor] = useState<CbtExamRecord | null>(null);
  const [bankId, setBankId] = useState('');
  const [bankQuestions, setBankQuestions] = useState<CbtQuestionRecord[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<string[]>([]);

  // Attempts panel
  const [attemptsFor, setAttemptsFor] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<string, CbtAttemptRecord[]>>({});

  // Access codes panel
  const [codesFor, setCodesFor] = useState<string | null>(null);
  const [codes, setCodes] = useState<Record<string, ExamAccessCodeRecord[]>>({});
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());

  // Create-bank modal
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [bankTitle, setBankTitle] = useState('');
  const [bankCourseId, setBankCourseId] = useState('');
  const [bankCategory, setBankCategory] = useState('');

  // Manage-bank modal
  const [manageBank, setManageBank] = useState<CbtBankRecord | null>(null);
  const [manageQuestions, setManageQuestions] = useState<CbtQuestionRecord[] | null>(null);
  const [bankView, setBankView] = useState<'list' | 'form' | 'upload'>('list');

  // Bulk upload state
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'parsing' | 'uploading' | 'done'>('idle');
  const [uploadResult, setUploadResult] = useState<{ count: number; errors: string[] } | null>(null);

  // Question form
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('OBJECTIVE');
  const [qMarks, setQMarks] = useState(1);
  const [qDifficulty, setQDifficulty] = useState('medium');
  const [qExplanation, setQExplanation] = useState('');
  const [qOptions, setQOptions] = useState(EMPTY_OPTIONS());

  const load = useCallback(async () => {
    setError(null);
    try {
      const [examList, bankList, coursePage, sessionList] = await Promise.all([
        cbtApi.exams(),
        cbtApi.banks(),
        academicsApi.courses({ pageSize: 200 }),
        sessionsApi.list(),
      ]);
      setExams(examList);
      setBanks(bankList);
      setCourses(coursePage.items);
      setSessions(sessionList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load CBT data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Load questions when the selected bank changes in the add-questions modal.
  useEffect(() => {
    if (!addFor || !bankId) {
      setBankQuestions([]);
      return;
    }
    let cancelled = false;
    cbtApi
      .bankQuestions(bankId)
      .then((qs) => {
        if (!cancelled) setBankQuestions(qs);
      })
      .catch(() => {
        if (!cancelled) setBankQuestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [addFor, bankId]);

  function courseCode(id: string | null): string {
    return courses.find((c) => c.id === id)?.code ?? '—';
  }

  // ---- Exam handlers ----

  function openCreateExam() {
    const current = sessions.find((s) => s.isCurrent)?.id ?? sessions[0]?.id ?? '';
    setSessionId(current);
    setCreateOpen(true);
  }

  function resetExamForm() {
    setTitle('');
    setCourseId('');
    setDuration(60);
    setPassMark(40);
    setStartsAt('');
    setEndsAt('');
    setInstructions('');
    setShuffle(true);
    setBrowserLock(false);
  }

  async function handleCreateExam(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy('create-exam');
    try {
      await cbtApi.createExam({
        title,
        courseId: courseId || undefined,
        sessionId: sessionId || undefined,
        durationMins: duration,
        passMark,
        instructions: instructions.trim() || undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        shuffleQuestions: shuffle,
        lockBrowser: browserLock,
      });
      setCreateOpen(false);
      resetExamForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exam.');
    } finally {
      setBusy(null);
    }
  }

  async function handleStatus(exam: CbtExamRecord, status: CbtExamStatus) {
    setBusy(exam.id);
    try {
      await cbtApi.setExamStatus(exam.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update exam.');
    } finally {
      setBusy(null);
    }
  }

  async function openAddQuestions(exam: CbtExamRecord) {
    setAddFor(exam);
    setBankId(banks[0]?.id ?? '');
    setSelected([]);
    setOriginalQuestions([]);
    // Fetch exam details to get existing questions
    try {
      const examDetails = await cbtApi.getExam(exam.id);
      const existingQuestionIds = examDetails.questions.map((eq: any) => eq.questionId);
      setSelected(existingQuestionIds);
      setOriginalQuestions(existingQuestionIds);
    } catch (err) {
      console.error('Failed to load exam questions:', err);
    }
  }

  function toggleQuestion(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id],
    );
  }

  async function handleAddQuestions(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!addFor) return;
    setBusy('add-questions');
    try {
      // Determine which questions to add and which to remove
      const toAdd = selected.filter((id) => !originalQuestions.includes(id));
      const toRemove = originalQuestions.filter((id) => !selected.includes(id));
      
      // Perform add and remove operations
      if (toAdd.length > 0) {
        await cbtApi.addExamQuestions(addFor.id, toAdd);
      }
      if (toRemove.length > 0) {
        await cbtApi.removeExamQuestions(addFor.id, toRemove);
      }
      
      setAddFor(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update questions.');
    } finally {
      setBusy(null);
    }
  }

  async function toggleAttempts(examId: string) {
    if (attemptsFor === examId) {
      setAttemptsFor(null);
      return;
    }
    setAttemptsFor(examId);
    if (!attempts[examId]) {
      try {
        const list = await cbtApi.examAttempts(examId);
        setAttempts((prev) => ({ ...prev, [examId]: list }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attempts.');
      }
    }
  }

  async function toggleCodes(examId: string) {
    if (codesFor === examId) {
      setCodesFor(null);
      return;
    }
    setCodesFor(examId);
    if (!codes[examId]) {
      try {
        const list = await cbtApi.listCodes(examId);
        setCodes((prev) => ({ ...prev, [examId]: list }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load access codes.');
      }
    }
  }

  async function handleGenerateCodes(examId: string) {
    setBusy('generate-codes');
    try {
      await cbtApi.generateCodes(examId);
      const list = await cbtApi.listCodes(examId);
      setCodes((prev) => ({ ...prev, [examId]: list }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate codes.');
    } finally {
      setBusy(null);
    }
  }

  function toggleCodeReveal(codeId: string) {
    setRevealedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(codeId)) next.delete(codeId);
      else next.add(codeId);
      return next;
    });
  }

  // ---- Bank handlers ----

  async function handleCreateBank(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy('create-bank');
    try {
      await cbtApi.createBank({
        title: bankTitle,
        courseId: bankCourseId || undefined,
        category: bankCategory.trim() || undefined,
      });
      setBankFormOpen(false);
      setBankTitle('');
      setBankCourseId('');
      setBankCategory('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question bank.');
    } finally {
      setBusy(null);
    }
  }

  async function openManage(bank: CbtBankRecord) {
    setManageBank(bank);
    setBankView('list');
    setManageQuestions(null);
    try {
      const qs = await cbtApi.bankQuestions(bank.id);
      setManageQuestions(qs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions.');
    }
  }

  function resetQuestionForm() {
    setQText('');
    setQType('OBJECTIVE');
    setQMarks(1);
    setQDifficulty('medium');
    setQExplanation('');
    setQOptions(EMPTY_OPTIONS());
    setError(null);
  }

  function handleTypeChange(type: string) {
    setQType(type);
    if (type === 'TRUE_FALSE') {
      setQOptions([
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false },
      ]);
    } else if (hasOptions(type)) {
      setQOptions(EMPTY_OPTIONS());
    }
  }

  function setOptionText(index: number, text: string) {
    setQOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)));
  }

  function setOptionCorrect(index: number, checked: boolean) {
    setQOptions((prev) =>
      prev.map((o, i) =>
        qType === 'MULTI_SELECT'
          ? i === index
            ? { ...o, isCorrect: checked }
            : o
          : { ...o, isCorrect: i === index ? checked : false },
      ),
    );
  }

  async function handleCreateQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!manageBank) return;

    const options = hasOptions(qType)
      ? qOptions
          .filter((o) => o.text.trim())
          .map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect }))
      : undefined;

    if (options && (options.length < 2 || !options.some((o) => o.isCorrect))) {
      setError('Provide at least two options and mark the correct answer.');
      return;
    }

    setBusy('create-question');
    try {
      await cbtApi.createQuestion({
        bankId: manageBank.id,
        type: qType,
        text: qText.trim(),
        marks: qMarks,
        difficulty: qDifficulty,
        explanation: qExplanation.trim() || undefined,
        options,
      });
      const qs = await cbtApi.bankQuestions(manageBank.id);
      setManageQuestions(qs);
      setBankView('list');
      resetQuestionForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question.');
    } finally {
      setBusy(null);
    }
  }

  // ---- Bulk upload ----

  const fileInputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const header = 'Type,Question,Marks,Difficulty,Explanation,Option A,Option B,Option C,Option D,Correct Answer(s)';
    const example1 = 'OBJECTIVE,What is the capital of France?,1,easy,France is in Europe,Paris,London,Berlin,Madrid,A';
    const example2 = 'TRUE_FALSE,The Earth is flat.,1,easy,,True,False,,,False';
    const example3 = 'MULTI_SELECT,Which are prime numbers?,2,medium,Select all that apply,2,3,4,5,"A,B,D"';
    const example4 = 'ESSAY,Explain photosynthesis.,5,hard,Describe the process in detail,,,,,';
    const csv = [header, example1, example2, example3, example4].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  function parseCSV(text: string): { questions: any[]; errors: string[] } {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) return { questions: [], errors: ['File must have a header row and at least one data row.'] };

    // Skip header row
    const dataLines = lines.slice(1);
    const questions: any[] = [];
    const errors: string[] = [];

    dataLines.forEach((line, idx) => {
      const rowNum = idx + 2; // 1-based, accounting for header
      try {
        const cols = parseCSVLine(line);
        const [type, questionText, marksStr, difficulty, explanation, optA, optB, optC, optD, correctStr] = cols;

        if (!questionText) {
          errors.push(`Row ${rowNum}: Question text is empty.`);
          return;
        }

        const qType = (type || 'OBJECTIVE').toUpperCase().replace(/\s+/g, '_');
        const validTypes = ['OBJECTIVE', 'MULTI_SELECT', 'TRUE_FALSE', 'ESSAY', 'FILL_BLANK'];
        if (!validTypes.includes(qType)) {
          errors.push(`Row ${rowNum}: Invalid type "${type}". Use OBJECTIVE, MULTI_SELECT, TRUE_FALSE, ESSAY, or FILL_BLANK.`);
          return;
        }

        const marks = marksStr ? parseInt(marksStr, 10) : 1;
        if (isNaN(marks) || marks < 1) {
          errors.push(`Row ${rowNum}: Marks must be a positive number.`);
          return;
        }

        const q: any = {
          type: qType,
          text: questionText,
          marks,
          difficulty: (difficulty || 'medium').toLowerCase(),
          explanation: explanation || undefined,
        };

        // Build options for types that need them
        if (qType === 'OBJECTIVE' || qType === 'MULTI_SELECT' || qType === 'TRUE_FALSE') {
          const optionTexts = [optA, optB, optC, optD].filter((o) => o && o.trim());
          if (optionTexts.length < 2) {
            errors.push(`Row ${rowNum}: Provide at least 2 options.`);
            return;
          }

          // Parse correct answers (A, B, C, D or comma-separated)
          const correctAnswers = correctStr
            ? correctStr.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
            : [];

          const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
          const correctIndices = new Set(
            correctAnswers.map((letter) => letterMap[letter]).filter((i) => i !== undefined),
          );

          if (correctIndices.size === 0) {
            errors.push(`Row ${rowNum}: No correct answer specified. Use A, B, C, D.`);
            return;
          }

          q.options = optionTexts.map((text, i) => ({
            text: text.trim(),
            isCorrect: correctIndices.has(i),
            order: i,
          }));
        }

        questions.push(q);
      } catch (err) {
        errors.push(`Row ${rowNum}: Failed to parse — ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    });

    return { questions, errors };
  }

  function handleFileSelect(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    setUploadFile(file);
    setUploadResult(null);
    setUploadProgress('idle');
  }

  async function handleBulkUpload() {
    if (!uploadFile || !manageBank) return;
    setUploadProgress('parsing');
    setError(null);

    try {
      const text = await uploadFile.text();
      const { questions, errors } = parseCSV(text);

      if (questions.length === 0) {
        setUploadResult({ count: 0, errors });
        setUploadProgress('idle');
        return;
      }

      setUploadProgress('uploading');
      const result = await cbtApi.bulkCreateQuestions({
        bankId: manageBank.id,
        questions,
      });

      setUploadResult({ count: result.count, errors });
      setUploadProgress('done');
      setUploadFile(null);

      // Refresh questions list
      const qs = await cbtApi.bankQuestions(manageBank.id);
      setManageQuestions(qs);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload questions.');
      setUploadProgress('idle');
    }
  }

  function resetUpload() {
    setUploadFile(null);
    setUploadResult(null);
    setUploadProgress('idle');
    setUploadDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ---- Columns ----

  const examColumns: Column<CbtExamRecord>[] = [
    {
      key: 'title',
      header: 'Exam',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.title}</p>
          <p className="text-xs text-gray-400">
            {r.durationMins} min · pass mark {r.passMark}
          </p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course',
      render: (r) => <span className="font-mono text-xs">{r.course?.code ?? '—'}</span>,
    },
    {
      key: 'questions',
      header: 'Questions',
      className: 'text-right',
      render: (r) => r._count.questions,
    },
    {
      key: 'attempts',
      header: 'Attempts',
      className: 'text-right',
      render: (r) => r._count.attempts,
    },
    {
      key: 'startsAt',
      header: 'Starts',
      className: 'whitespace-nowrap',
      render: (r) => formatWhen(r.startsAt) ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {(r.status === 'DRAFT' || r.status === 'SCHEDULED') && (
            <>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => handleStatus(r, 'ACTIVE')}
                className="btn-primary px-2.5 py-1 text-xs disabled:opacity-60"
              >
                {r.status === 'DRAFT' ? 'Publish' : 'Activate'}
              </button>
              <button
                type="button"
                onClick={() => openAddQuestions(r)}
                className="btn-secondary px-2.5 py-1 text-xs"
              >
                <Plus className="h-3 w-3" /> Questions
              </button>
            </>
          )}
          {r.status === 'ACTIVE' && (
            <button
              type="button"
              disabled={busy === r.id}
              onClick={() => handleStatus(r, 'CLOSED')}
              className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-60"
            >
              Close
            </button>
          )}
          {r.status === 'CLOSED' && (
            <>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => handleStatus(r, 'ACTIVE')}
                className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-60"
              >
                Reopen
              </button>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => handleStatus(r, 'ARCHIVED')}
                className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-60"
              >
                Archive
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => toggleAttempts(r.id)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
              attemptsFor === r.id
                ? 'bg-brand/10 text-brand'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            )}
          >
            <ListChecks className="h-3.5 w-3.5" />
            {attemptsFor === r.id ? 'Hide' : 'Attempts'}
          </button>
          {(r.status === 'ACTIVE' || r.status === 'SCHEDULED') && (
            <button
              type="button"
              onClick={() => toggleCodes(r.id)}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                codesFor === r.id
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
              )}
            >
              <Database className="h-3.5 w-3.5" />
              {codesFor === r.id ? 'Hide' : 'Codes'}
            </button>
          )}
        </div>
      ),
    },
  ];

  const attemptColumns: Column<CbtAttemptRecord>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (a) => (
        <span className="font-medium text-gray-900">
          {a.student.firstName} {a.student.lastName}
        </span>
      ),
    },
    {
      key: 'matric',
      header: 'Matric No',
      render: (a) => (
        <span className="font-mono text-xs">{a.student.matricNumber ?? '—'}</span>
      ),
    },
    {
      key: 'started',
      header: 'Started',
      className: 'whitespace-nowrap',
      render: (a) => formatWhen(a.startedAt) ?? '—',
    },
    {
      key: 'submitted',
      header: 'Submitted',
      className: 'whitespace-nowrap',
      render: (a) => formatWhen(a.submittedAt) ?? '—',
    },
    {
      key: 'score',
      header: 'Score',
      className: 'text-right font-semibold text-gray-900',
      render: (a) => Number(a.score),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge status={a.status.replace('_', ' ')} />,
    },
  ];

  const bankColumns: Column<CbtBankRecord>[] = [
    {
      key: 'title',
      header: 'Bank',
      render: (b) => (
        <div>
          <p className="font-medium text-gray-900">{b.title}</p>
          {b.category && <p className="text-xs text-gray-400">{b.category}</p>}
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course',
      render: (b) => <span className="font-mono text-xs">{courseCode(b.courseId)}</span>,
    },
    {
      key: 'questions',
      header: 'Questions',
      className: 'text-right',
      render: (b) => b._count.questions,
    },
    {
      key: 'created',
      header: 'Created',
      className: 'whitespace-nowrap',
      render: (b) => formatWhen(b.createdAt) ?? '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (b) => (
        <button
          type="button"
          onClick={() => openManage(b)}
          className="btn-secondary px-2.5 py-1.5 text-xs"
        >
          <FileQuestion className="h-3.5 w-3.5" /> Manage Questions
        </button>
      ),
    },
  ];

  const attemptsExam = attemptsFor ? exams.find((e) => e.id === attemptsFor) : null;

  return (
    <>
      <PageHeader
        title="Computer-Based Testing"
        subtitle="Schedule CBT exams and manage question banks."
        action={
          tab === 'exams' ? (
            <button type="button" onClick={openCreateExam} className="btn-primary">
              <Plus className="h-4 w-4" /> New Exam
            </button>
          ) : (
            <button type="button" onClick={() => setBankFormOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> New Question Bank
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-card">
        <button
          type="button"
          onClick={() => setTab('exams')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
            tab === 'exams' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900',
          )}
        >
          <FileQuestion className="h-4 w-4" /> Exams
        </button>
        <button
          type="button"
          onClick={() => setTab('banks')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
            tab === 'banks' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900',
          )}
        >
          <Database className="h-4 w-4" /> Question Banks
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {tab === 'exams' ? (
        <>
          <Card title="Scheduled Exams" subtitle="Upcoming, live and completed CBT exams">
            {loading ? (
              <p className="px-5 py-12 text-center text-sm text-gray-400">Loading exams…</p>
            ) : (
              <DataTable columns={examColumns} rows={exams} keyField="id" emptyMessage="No exams yet. Create your first exam to get started." />
            )}
          </Card>

          {attemptsFor && attemptsExam && (
            <Card
              title={`Attempts — ${attemptsExam.title}`}
              subtitle="Students who have started this exam"
              className="mt-4"
            >
              {!attempts[attemptsFor] ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">Loading attempts…</p>
              ) : (
                <DataTable
                  columns={attemptColumns}
                  rows={attempts[attemptsFor]}
                  keyField="id"
                  emptyMessage="No attempts recorded yet."
                />
              )}
            </Card>
          )}

          {codesFor && (
            <Card
              title={`Access Codes — ${exams.find((e) => e.id === codesFor)?.title}`}
              subtitle="One-time-use exam access codes for students"
              className="mt-4"
            >
              <div className="space-y-4 px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {codes[codesFor] ? (
                      <>
                        <strong>
                          {codes[codesFor].filter((c) => c.usedBy).length}
                        </strong>{' '}
                        of <strong>{codes[codesFor].length}</strong> codes used
                      </>
                    ) : (
                      'Loading codes…'
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleGenerateCodes(codesFor)}
                    disabled={busy === 'generate-codes'}
                    className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
                  >
                    {busy === 'generate-codes' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Generate 10 Codes
                      </>
                    )}
                  </button>
                </div>

                {codes[codesFor] && codes[codesFor].length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <th className="pb-2 pr-4">Code</th>
                          <th className="pb-2 pr-4">Student</th>
                          <th className="pb-2 pr-4">Status</th>
                          <th className="pb-2">Used At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {codes[codesFor].map((code) => (
                          <tr key={code.id} className="hover:bg-gray-50">
                            <td className="py-2.5 pr-4">
                              <button
                                type="button"
                                onClick={() => toggleCodeReveal(code.id)}
                                className="font-mono text-xs font-semibold text-gray-900 hover:text-brand"
                              >
                                {revealedCodes.has(code.id) ? code.code : '••••-••••-••••'}
                              </button>
                            </td>
                            <td className="py-2.5 pr-4">
                              {code.usedBy ? (
                                <div>
                                  <p className="text-xs font-medium text-gray-900">
                                    {code.usedBy.firstName} {code.usedBy.lastName}
                                  </p>
                                  <p className="text-[11px] text-gray-500">{code.usedBy.email}</p>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 pr-4">
                              {code.usedBy ? (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                  Used
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                  Available
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-xs text-gray-500">
                              {code.usedAt ? formatWhen(code.usedAt) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {codes[codesFor] && codes[codesFor].length === 0 && (
                  <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                    No codes generated yet. Click &quot;Generate 10 Codes&quot; to create access codes for this exam.
                  </p>
                )}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card title="Question Banks" subtitle="Reusable question pools by course">
          {loading ? (
            <p className="px-5 py-12 text-center text-sm text-gray-400">Loading banks…</p>
          ) : (
            <DataTable
              columns={bankColumns}
              rows={banks}
              keyField="id"
              emptyMessage="No question banks yet. Create one to start adding questions."
            />
          )}
        </Card>
      )}

      {/* Create exam modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">New Exam</h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4 px-6 py-5">
              <div>
                <label className="label">Exam Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CSC 101 Mid-Semester Test"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Course (optional)</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="input"
                  >
                    <option value="">No course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Session</label>
                  <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="input"
                  >
                    <option value="">No session</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.isCurrent ? ' (current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Duration (mins)</label>
                  <input
                    type="number"
                    min={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Pass Mark</label>
                  <input
                    type="number"
                    min={0}
                    value={passMark}
                    onChange={(e) => setPassMark(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Starts At (optional)</label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Ends At (optional)</label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Instructions (optional)</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  placeholder="Shown to students before they begin…"
                  className="input resize-none"
                />
              </div>

              <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      Shuffle questions
                    </span>
                    <span className="text-xs text-gray-500">
                      Randomise question order per student
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={shuffle}
                    onChange={(e) => setShuffle(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium text-gray-800">Browser lock</span>
                    <span className="text-xs text-gray-500">
                      Prevent tab switching during the exam
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={browserLock}
                    onChange={(e) => setBrowserLock(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'create-exam'}
                  className="btn-primary disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {busy === 'create-exam' ? 'Creating…' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add questions modal */}
      {addFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Add Questions</h3>
                <p className="mt-0.5 text-xs text-gray-500">{addFor.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setAddFor(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuestions} className="space-y-4 px-6 py-5">
              {banks.length === 0 ? (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  No question banks yet. Create a bank in the Question Banks tab first.
                </p>
              ) : (
                <>
                  <div>
                    <label className="label">Question Bank</label>
                    <select
                      value={bankId}
                      onChange={(e) => {
                        setBankId(e.target.value);
                        setSelected([]);
                      }}
                      className="input"
                    >
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({b._count.questions} questions)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-3">
                    {bankQuestions.length === 0 ? (
                      <p className="py-6 text-center text-xs text-gray-400">
                        No questions in this bank.
                      </p>
                    ) : (
                      bankQuestions.map((q) => {
                        const checked = selected.includes(q.id);
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => toggleQuestion(q.id)}
                            className={cn(
                              'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
                              checked
                                ? 'border-brand/40 bg-brand/5'
                                : 'border-gray-100 hover:bg-gray-50',
                            )}
                          >
                            {checked ? (
                              <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                            ) : (
                              <Square className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                            )}
                            <span>
                              <span className="block text-xs font-medium text-gray-800">
                                {q.text}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-gray-400">
                                {typeLabel(q.type)} · {q.marks} mark{q.marks === 1 ? '' : 's'}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setAddFor(null)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    busy === 'add-questions' ||
                    (selected.length === originalQuestions.length &&
                      selected.every((id) => originalQuestions.includes(id)))
                  }
                  className="btn-primary disabled:opacity-60"
                >
                  {busy === 'add-questions' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      {(() => {
                        const toAdd = selected.filter((id) => !originalQuestions.includes(id));
                        const toRemove = originalQuestions.filter((id) => !selected.includes(id));
                        if (toAdd.length > 0 && toRemove.length > 0) {
                          return `Update (${toAdd.length} added, ${toRemove.length} removed)`;
                        } else if (toAdd.length > 0) {
                          return `Add ${toAdd.length} question${toAdd.length === 1 ? '' : 's'}`;
                        } else if (toRemove.length > 0) {
                          return `Remove ${toRemove.length} question${toRemove.length === 1 ? '' : 's'}`;
                        }
                        return 'No changes';
                      })()}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create bank modal */}
      {bankFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">New Question Bank</h3>
              <button
                type="button"
                onClick={() => setBankFormOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBank} className="space-y-4 px-6 py-5">
              <div>
                <label className="label">Bank Title</label>
                <input
                  required
                  value={bankTitle}
                  onChange={(e) => setBankTitle(e.target.value)}
                  placeholder="e.g. CSC 101 — First Semester Pool"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Course (optional)</label>
                <select
                  value={bankCourseId}
                  onChange={(e) => setBankCourseId(e.target.value)}
                  className="input"
                >
                  <option value="">No course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Category (optional)</label>
                <input
                  value={bankCategory}
                  onChange={(e) => setBankCategory(e.target.value)}
                  placeholder="e.g. Past questions, Mock exams"
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setBankFormOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'create-bank'}
                  className="btn-primary disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {busy === 'create-bank' ? 'Creating…' : 'Create Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage bank modal */}
      {manageBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                {bankView !== 'list' && (
                  <button
                    type="button"
                    onClick={() => {
                      setBankView('list');
                      resetUpload();
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                    aria-label="Back to questions"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {bankView === 'list' ? 'Question Bank' : bankView === 'upload' ? 'Upload Questions' : 'Add Question'}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {manageBank.title} · {courseCode(manageBank.courseId)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setManageBank(null);
                  resetQuestionForm();
                  resetUpload();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {bankView === 'list' ? (
              <div className="px-6 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {manageQuestions === null
                      ? 'Loading questions…'
                      : `${manageQuestions.length} question${manageQuestions.length === 1 ? '' : 's'} in this bank`}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBankView('form')}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Question
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBankView('upload'); resetUpload(); }}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload from File
                    </button>
                  </div>
                </div>

                {manageQuestions !== null &&
                  (manageQuestions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                      No questions yet. Add the first one.
                    </p>
                  ) : (
                    <ul className="space-y-2.5">
                      {manageQuestions.map((q) => {
                        const correct = q.options.filter((o) => o.isCorrect).length;
                        return (
                          <li
                            key={q.id}
                            className="rounded-xl border border-gray-100 px-4 py-3"
                          >
                            <p className="text-sm font-medium text-gray-800">{q.text}</p>
                            <p className="mt-1 text-xs text-gray-400">
                              {typeLabel(q.type)} · {q.marks} mark{q.marks === 1 ? '' : 's'} ·{' '}
                              {q.difficulty ?? 'medium'}
                              {q.options.length > 0 &&
                                ` · ${q.options.length} options (${correct} correct)`}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  ))}
              </div>
            ) : bankView === 'upload' ? (
              <div className="px-6 py-5">
                {/* Template download */}
                <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="mb-2 text-sm font-semibold text-blue-900">How to upload questions:</p>
                  <ol className="space-y-1 text-xs text-blue-800">
                    <li>1. Download the CSV template below</li>
                    <li>2. Fill in your questions following the format in the template</li>
                    <li>3. Upload the completed CSV file here</li>
                  </ol>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-200"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Template
                  </button>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setUploadDragOver(true); }}
                  onDragLeave={() => setUploadDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setUploadDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileSelect(file);
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
                    uploadDragOver
                      ? 'border-brand bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  <Upload className={cn('h-8 w-8', uploadDragOver ? 'text-brand' : 'text-gray-300')} />
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Drag and drop your CSV file here
                  </p>
                  <p className="mt-1 text-xs text-gray-400">or</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary mt-3 px-4 py-2 text-xs"
                  >
                    Browse Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>

                {/* Selected file */}
                {uploadFile && (
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileQuestion className="h-5 w-5 text-brand" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{uploadFile.name}</p>
                        <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={resetUpload}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Upload result */}
                {uploadResult && (
                  <div className="mt-4 space-y-2">
                    {uploadResult.count > 0 && (
                      <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        Successfully imported {uploadResult.count} question{uploadResult.count === 1 ? '' : 's'}.
                      </div>
                    )}
                    {uploadResult.errors.length > 0 && (
                      <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                        <p className="mb-1 text-sm font-semibold text-red-700">
                          {uploadResult.errors.length} issue{uploadResult.errors.length === 1 ? '' : 's'} found:
                        </p>
                        <ul className="space-y-0.5 text-xs text-red-600">
                          {uploadResult.errors.map((err, i) => (
                            <li key={i}>• {err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload button */}
                <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => { setBankView('list'); resetUpload(); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkUpload}
                    disabled={!uploadFile || uploadProgress === 'parsing' || uploadProgress === 'uploading'}
                    className="btn-primary disabled:opacity-60"
                  >
                    {uploadProgress === 'parsing' ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Parsing…</>
                    ) : uploadProgress === 'uploading' ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
                    ) : uploadProgress === 'done' ? (
                      <><CheckSquare className="h-4 w-4" /> Done</>
                    ) : (
                      <><Upload className="h-4 w-4" /> Upload Questions</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateQuestion} className="space-y-4 px-6 py-5">
                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}
                
                {/* Instructions */}
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="mb-2 text-sm font-semibold text-blue-900">Instructions for adding questions:</p>
                  <ul className="space-y-1 text-xs text-blue-800">
                    <li>• <strong>Objective questions:</strong> Provide at least 2 options and mark the correct answer(s)</li>
                    <li>• <strong>True/False questions:</strong> Select either True or False as the correct answer</li>
                    <li>• <strong>Essay questions:</strong> No options needed, just set the marks</li>
                    <li>• <strong>Multi-select:</strong> Mark multiple options as correct if needed</li>
                    <li>• <strong>Explanation:</strong> Optional but recommended for student learning</li>
                  </ul>
                </div>
                
                <div>
                  <label className="label">Question</label>
                  <textarea
                    required
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    rows={3}
                    placeholder="Type the question text…"
                    className="input resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Type</label>
                    <select
                      value={qType}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="input"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {typeLabel(t)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Marks</label>
                    <input
                      type="number"
                      min={1}
                      value={qMarks}
                      onChange={(e) => setQMarks(Number(e.target.value))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Difficulty</label>
                    <select
                      value={qDifficulty}
                      onChange={(e) => setQDifficulty(e.target.value)}
                      className="input"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {hasOptions(qType) && (
                  <div>
                    <label className="label">
                      Options{' '}
                      <span className="font-normal text-gray-400">
                        — mark the correct answer{qType === 'MULTI_SELECT' ? 's' : ''}
                      </span>
                    </label>
                    <div className="space-y-2">
                      {qOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <input
                            type={qType === 'MULTI_SELECT' ? 'checkbox' : 'radio'}
                            name="correct-option"
                            checked={opt.isCorrect}
                            onChange={(e) => setOptionCorrect(i, e.target.checked)}
                            className="h-4 w-4 shrink-0 border-gray-300 text-brand focus:ring-brand"
                            aria-label={`Option ${i + 1} is correct`}
                          />
                          <input
                            value={opt.text}
                            onChange={(e) => setOptionText(i, e.target.value)}
                            placeholder={`Option ${i + 1}`}
                            className="input"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Explanation (optional)</label>
                  <input
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    placeholder="Shown to students after grading…"
                    className="input"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setBankView('list')}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy === 'create-question'}
                    className="btn-primary disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {busy === 'create-question' ? 'Saving…' : 'Save Question'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
