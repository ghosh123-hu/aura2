import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  sendEmailVerificationCode,
  verifyEmailCode,
  getPendingOtp,
} from '../services/auraAuthService';
import { AuraUser } from '../types';

interface AuthViewProps {
  onSuccess: (user: AuraUser) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, showToast }) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dispatchedCode, setDispatchedCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check for any pending unexpired OTP on mount
  useEffect(() => {
    const pending = getPendingOtp();
    if (pending) {
      setEmail(pending.email);
      if (pending.name) setName(pending.name);
      setDispatchedCode(pending.code);
      setStep('code');
      const secondsLeft = Math.max(0, Math.floor((pending.expiresAt - Date.now()) / 1000));
      setCountdown(Math.min(secondsLeft, 45));
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Focus first input when moving to code step
  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);

    const res = sendEmailVerificationCode(cleanEmail, name);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to send code');
      setLoading(false);
      return;
    }

    setDispatchedCode(res.code);
    setCountdown(45);
    setDigits(['', '', '', '', '', '']);
    setStep('code');
    setLoading(false);
    showToast(`Verification code dispatched to ${cleanEmail}`, 'info');
  };

  const handleResendCode = () => {
    if (countdown > 0 || !email.trim()) return;
    setLoading(true);
    const res = sendEmailVerificationCode(email, name);
    if (res.success) {
      setDispatchedCode(res.code);
      setCountdown(45);
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      showToast('A fresh verification code has been dispatched!', 'success');
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } else {
      setErrorMsg(res.error || 'Failed to resend code');
    }
    setLoading(false);
  };

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMsg(null);

    // If entered a digit, advance focus to next box
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits filled
    const completeCode = newDigits.join('');
    if (completeCode.length === 6 && !newDigits.includes('')) {
      performVerification(completeCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // If current is empty and hit backspace, jump to previous box
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      performVerification(pasted);
    }
  };

  const performVerification = (codeToVerify: string) => {
    setLoading(true);
    setErrorMsg(null);

    const result = verifyEmailCode(email, codeToVerify);
    if (!result.success || !result.user) {
      setErrorMsg(result.error || 'Verification failed. Please check the code.');
      setLoading(false);
      return;
    }

    showToast(`Welcome to Aura, ${result.user.name || 'friend'}!`, 'success');
    onSuccess(result.user);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits of the code.');
      return;
    }
    performVerification(code);
  };

  const handleAutoFill = () => {
    if (!dispatchedCode) return;
    const split = dispatchedCode.split('');
    setDigits(split);
    performVerification(dispatchedCode);
  };

  const handleCopyCode = () => {
    if (!dispatchedCode) return;
    navigator.clipboard.writeText(dispatchedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast('Code copied to clipboard', 'info');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-pastel-sageLight border border-pastel-sageBorder flex items-center justify-center text-emerald-800 font-bold text-xl shadow-soft">
            A
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900">
          Aura
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500 font-medium">
          Personal Productivity, Focus & Self-Control
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-soft-md rounded-2xl border border-app-border sm:px-8">
          {/* STEP 1: ENTER EMAIL */}
          {step === 'email' && (
            <div>
              <div className="mb-6">
                <h3 className="text-base font-bold text-stone-900">Sign in to Aura</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Enter your email address to receive a secure 6-digit login code.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoFocus
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Your Name <span className="font-normal text-stone-400 normal-case">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-soft transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue with Email Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-stone-100 text-center text-[11px] text-stone-400">
                Passwordless authentication · Fast and secure sign-in
              </div>
            </div>
          )}

          {/* STEP 2: ENTER 6-DIGIT CODE */}
          {step === 'code' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setErrorMsg(null);
                  }}
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change email</span>
                </button>
                <span className="text-[11px] text-stone-400 font-mono">Step 2 of 2</span>
              </div>

              <div className="mb-5">
                <h3 className="text-base font-bold text-stone-900">Enter verification code</h3>
                <p className="text-xs text-stone-500 mt-1">
                  We sent a 6-digit security code to{' '}
                  <span className="font-semibold text-stone-800">{email}</span>.
                </p>
              </div>

              {/* In-app Email Dispatch Simulation Banner */}
              {dispatchedCode && (
                <div className="mb-5 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Email Code Delivered</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 rounded transition flex items-center gap-1"
                        title="Copy code"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 font-mono font-bold text-sm text-emerald-950 tracking-wider">
                      {dispatchedCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoFill}
                      className="text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-100/60 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-soft-sm transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Auto-fill</span>
                    </button>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="space-y-5">
                {/* 6 Digit Input Boxes */}
                <div className="flex justify-between gap-2 sm:gap-2.5">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-bold rounded-xl border bg-stone-50 transition ${
                        digit
                          ? 'border-emerald-700 text-stone-900 bg-white ring-1 ring-emerald-700'
                          : 'border-stone-200 text-stone-800 focus:bg-white focus:border-stone-400'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || digits.join('').length < 6}
                  className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-soft transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Enter Workspace</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Resend Code Section */}
              <div className="mt-5 text-center text-xs text-stone-500">
                {countdown > 0 ? (
                  <span>Resend code in <span className="font-semibold text-stone-700">{countdown}s</span></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="font-semibold text-emerald-800 hover:text-emerald-950 underline transition"
                  >
                    Resend verification code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
