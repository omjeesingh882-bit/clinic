'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Stethoscope, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendForgotPasswordOTP, verifyForgotPasswordOTP, resetPassword } from '@/actions/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await sendForgotPasswordOTP(email);
      if (result.success) {
        toast.success('Password reset code sent!');
        setStep(2);
      } else {
        setError(result.error || 'Failed to send reset code.');
      }
    } catch (err: any) {
      console.error('Send reset OTP error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await verifyForgotPasswordOTP(email, code);
      if (result.success) {
        toast.success('Code verified!');
        setStep(3);
      } else {
        setError(result.error || 'Invalid reset code.');
      }
    } catch (err: any) {
      console.error('Verify reset OTP error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email, password);
      if (result.success) {
        toast.success('Password reset successfully!');
        router.push('/login');
      } else {
        setError(result.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-blue-100 p-3 rounded-full mb-4">
          <Stethoscope className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
        <p className="text-sm text-gray-500 mt-2">Recover your ClinicOCR account</p>
      </div>

      <div className="flex justify-center items-center space-x-3 mb-8">
        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`w-12 h-1 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`w-12 h-1 rounded ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
      </div>

      {step === 1 && (
        <form onSubmit={handleSendCode} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your registered email"
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Sending...</> : 'Send Reset Code'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div className="text-center text-sm text-gray-600 mb-4">
            We sent a code to <span className="font-medium text-gray-900">{email}</span>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="code">
              6-Digit Reset Code
            </label>
            <input
              id="code"
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-widest rounded-lg border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="000000"
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Verifying...</> : 'Verify Code'}
          </button>
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Resend Code
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                placeholder="Enter new password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                placeholder="Confirm new password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Resetting...</> : 'Reset Password'}
          </button>
        </form>
      )}

      <div className="mt-8 text-center">
        <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
