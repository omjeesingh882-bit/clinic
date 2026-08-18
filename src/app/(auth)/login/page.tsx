'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Stethoscope, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loginAction } from '@/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await loginAction(identifier, password);
      if (result.success) {
        toast.success('Logged in successfully!');
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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
        <h1 className="text-2xl font-bold text-gray-900">Welcome to ClinicOCR</h1>
        <p className="text-sm text-gray-500 mt-2">Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700" htmlFor="identifier">
            Username or Email
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            placeholder="Enter your username or email"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors pr-10"
              placeholder="Enter your password"
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

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
