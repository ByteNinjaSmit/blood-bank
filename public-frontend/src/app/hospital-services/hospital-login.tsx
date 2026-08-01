'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';

const REGISTERED_EMAILS = [
  'sai.healthcare@sanjivani.com',
  'city.hospital@gmail.com',
  'rural.clinic@gmail.com',
  'kopargaon.healthcare@sanjivani.com',
];

interface HospitalLoginProps {
  onLoginSuccess: (token: string, name: string) => void;
}

export default function HospitalLogin({ onLoginSuccess }: HospitalLoginProps) {
  const { language } = useLanguage();
  const t = content[language].hospitalPortal;

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // OTP state
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [expirySeconds, setExpirySeconds] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  /* ---- Countdown timers for OTP ---- */
  useEffect(() => {
    if (expirySeconds <= 0) return;
    const id = setInterval(() => setExpirySeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [expirySeconds]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const clearError = () => setError('');

  /* ---- Step 1: Submit Email to get OTP ---- */
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    setTimeout(() => {
      const trimmed = email.trim().toLowerCase();
      // Simple verification if it is a valid email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setError(t.invalidEmail);
        setLoading(false);
        return;
      }

      if (!REGISTERED_EMAILS.includes(trimmed)) {
        setError(t.unregisteredEmail);
        setLoading(false);
        return;
      }

      setExpirySeconds(300);
      setResendCooldown(30);
      setStep(2);
      setLoading(false);
    }, 800);
  };

  /* ---- Step 2: OTP inputs handling ---- */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== '')) {
      submitOtp(next.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (next.every((d) => d !== '')) submitOtp(next.join(''));
  };

  /* ---- Verify OTP code ---- */
  const submitOtp = (code: string) => {
    clearError();
    setLoading(true);

    setTimeout(() => {
      if (expirySeconds === 0) {
        setError(t.codeExpiredMessage);
        setLoading(false);
        return;
      }

      // Allow any 6-digit verification code for a seamless frontend-only experience
      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess('session-jwt-final', 'Sanjivani Blood Bank, Kopargaon');
        setSuccess(false);
      }, 1000);
      setLoading(false);
    }, 800);
  };

  /* ---- Resend OTP ---- */
  const handleResend = () => {
    if (resendCooldown > 0) return;
    clearError();
    setLoading(true);

    setTimeout(() => {
      setExpirySeconds(300);
      setResendCooldown(30);
      setOtp(Array(6).fill(''));
      otpRefs.current[0]?.focus();
      setLoading(false);
    }, 600);
  };

  return (
    <motion.div
      key="auth-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 pt-28 pb-16"
    >
      {/* Sleek minimalist ambient background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Ultra-minimalist compact card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Minimal Header */}
          <div className="mb-6 text-left">
            <h1 className="text-xl font-bold text-white tracking-tight">{t.portalTitle}</h1>
            <p className="text-xs text-slate-400 mt-1">{t.emailDescription}</p>
          </div>

          {/* Errors */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-3.5 py-2.5 mb-5 text-xs"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Overlay */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 rounded-2xl"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-pulse" />
                <p className="mt-2 text-white font-medium text-sm">{t.verifiedSuccess}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Steps */}
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="email-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleEmailSubmit}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.emailLabel}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[#8B0000] transition-colors text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#8B0000] hover:bg-[#700000] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-xs cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t.proceedBtn}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.verificationTitle}</span>
                  <p className="text-xs text-slate-300">
                    {t.verificationText} <span className="text-white font-medium">{email}</span>.
                  </p>
                </div>

                {/* OTP Boxes */}
                <div className="flex justify-between gap-1.5" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-10 h-12 text-center text-xl font-bold text-white bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-[#8B0000] transition-colors"
                    />
                  ))}
                </div>

                {/* OTP countdown */}
                {expirySeconds > 0 ? (
                  <p className="text-left text-[11px] text-slate-500">
                    {t.codeExpires}{' '}
                    <span className="font-mono text-slate-300 font-medium">
                      {fmt(expirySeconds)}
                    </span>
                  </p>
                ) : (
                  <p className="text-left text-[11px] text-red-400 font-semibold">{t.codeExpired}</p>
                )}

                <button
                  onClick={() => submitOtp(otp.join(''))}
                  disabled={loading || otp.some((d) => d === '')}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#8B0000] hover:bg-[#700000] disabled:opacity-40 text-white font-semibold rounded-xl transition-colors text-xs cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t.verifyBtn}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {/* Resend actions */}
                <div className="flex items-center justify-between text-[11px] border-t border-slate-800/60 pt-3">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {resendCooldown > 0 ? t.resendCooldownText.replace('{s}', String(resendCooldown)) : t.resendBtn}
                  </button>

                  <button
                    onClick={() => {
                      setStep(1);
                      setOtp(Array(6).fill(''));
                      clearError();
                    }}
                    className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {t.changeEmailBtn}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
