'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  School as SchoolIcon,
  Hash,
  Building2,
} from 'lucide-react';
import { authApi, academicsApi, type School, type Department } from '@/lib/api';

const STEPS = ['Verify Identity', 'Create Account'];

export default function SelfRegisterPage() {
  const [step, setStep] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Step 1 fields
  const [schoolId, setSchoolId] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Step 2 fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load schools on mount
  useEffect(() => {
    async function loadData() {
      try {
        const schoolsData = await academicsApi.schools();
        setSchools(schoolsData);
        if (schoolsData.length === 1) {
          setSchoolId(schoolsData[0].id);
        }
      } catch (err) {
        console.error('Failed to load schools:', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  // Load departments when school changes
  useEffect(() => {
    if (!schoolId) {
      setDepartments([]);
      return;
    }
    async function loadDepartments() {
      try {
        const deps = await academicsApi.departments(schoolId);
        setDepartments(deps);
      } catch (err) {
        console.error('Failed to load departments:', err);
        setDepartments([]);
      }
    }
    loadDepartments();
  }, [schoolId]);

  async function handleStep1(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStep(2);
  }

  async function handleStep2(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await authApi.selfRegister({
        matricNumber,
        departmentId,
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        schoolId,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-dark via-brand to-brand-light px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <div className="rounded-2xl bg-white p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900">Registration Submitted!</h2>
            <p className="mt-4 text-sm text-slate-600">
              Your account is awaiting admin approval. You&apos;ll receive a notification once your
              account has been approved by the school administrator.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Please check your email for further instructions.
            </p>
            <Link href="/login" className="btn-primary mt-6 w-full">
              Return to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-dark via-brand to-brand-light px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
            <Image
              src="/logo.png"
              alt="Goinzeschool logo"
              width={56}
              height={56}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Your Portal Account</h1>
          <p className="mt-1 text-sm text-blue-100">
            Already have a matric number? Register for portal access.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  step > idx + 1
                    ? 'bg-green-500 text-white'
                    : step === idx + 1
                      ? 'bg-white text-brand'
                      : 'bg-white/20 text-white/60'
                }`}
              >
                {step > idx + 1 ? '✓' : idx + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  step === idx + 1 ? 'text-white' : 'text-white/60'
                }`}
              >
                {label}
              </span>
              {idx < STEPS.length - 1 && <div className="mx-2 h-px w-8 bg-white/30" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-slate-900">Verify Your Identity</h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter your student details to verify your identity.
              </p>

              {error && (
                <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {loadingData ? (
                <div className="mt-6 flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand" />
                </div>
              ) : (
                <form onSubmit={handleStep1} className="mt-6 space-y-5">
                  {/* School selector - only show if multiple schools */}
                  {schools.length > 1 && (
                    <div>
                      <label htmlFor="schoolId" className="field-label">
                        School
                      </label>
                      <div className="relative">
                        <SchoolIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <select
                          id="schoolId"
                          required
                          value={schoolId}
                          onChange={(e) => {
                            setSchoolId(e.target.value);
                            setDepartmentId('');
                          }}
                          className="input-field pl-10"
                        >
                          <option value="">Select your school</option>
                          {schools.map((school) => (
                            <option key={school.id} value={school.id}>
                              {school.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="matricNumber" className="field-label">
                      Matric Number
                    </label>
                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="matricNumber"
                        type="text"
                        required
                        value={matricNumber}
                        onChange={(e) => setMatricNumber(e.target.value)}
                        placeholder="e.g., CSC/2020/001"
                        className="input-field pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="departmentId" className="field-label">
                      Department
                    </label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        id="departmentId"
                        required
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="input-field pl-10"
                        disabled={!schoolId || departments.length === 0}
                      >
                        <option value="">Select your department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="field-label">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="firstName"
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                          className="input-field pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="lastName" className="field-label">
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="lastName"
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last name"
                          className="input-field pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full">
                    <ArrowRight className="h-4 w-4" />
                    Continue
                  </button>
                </form>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-slate-900">Create Your Account</h2>
              <p className="mt-1 text-sm text-slate-500">
                Set up your login credentials for the student portal.
              </p>

              {error && (
                <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleStep2} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="email" className="field-label">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="field-label">
                    Phone Number <span className="text-slate-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="field-label">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="input-field pl-10 pr-4"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="field-label">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="input-field pl-10 pr-4"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary flex-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-brand hover:text-brand-dark">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-blue-100/80">
          © {new Date().getFullYear()} Goinzeschool · Enterprise School ERP
        </p>
      </div>
    </main>
  );
}
