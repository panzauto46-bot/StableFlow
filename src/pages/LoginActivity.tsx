import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';

interface LoginActivityProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onDemoLogin: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const LoginActivity: React.FC<LoginActivityProps> = ({
  onLogin,
  onRegister,
  onDemoLogin,
  isLoading,
  error,
  clearError
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validation
    if (!email || !email.includes('@')) {
      setLocalError('Masukkan email yang valid');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password minimal 6 karakter');
      return;
    }

    if (!isLoginMode && password !== confirmPassword) {
      setLocalError('Password tidak cocok');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        const result = await onLogin(email, password);
        if (!result.success) {
          setLocalError(result.error || 'Login gagal');
        }
      } else {
        const result = await onRegister(email, password);
        if (!result.success) {
          setLocalError(result.error || 'Registrasi gagal');
        }
      }
    } catch (err) {
      setLocalError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setLocalError(null);
    clearError();
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a1628] via-[#142038] to-[#1e3a5f]">
      {/* Header with Logo */}
      <div className="flex-shrink-0 pt-12 pb-8 px-6 text-center">
        {/* Logo Container */}
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#d4a940] to-[#f5d77e] shadow-xl shadow-[#d4a940]/30 flex items-center justify-center animate-float">
            <svg 
              className="w-10 h-10 text-[#0a1628]" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-[#d4a940] opacity-20 blur-xl"></div>
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl font-bold mb-2">
          <span className="gold-text">Stable</span>
          <span className="text-white">Flow</span>
        </h1>
        <p className="text-white/60 text-sm">
          Manajemen Keuangan USDC Premium
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-8">
        {/* Glass Card */}
        <div className="glass rounded-3xl p-6 max-w-md mx-auto">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setIsLoginMode(true); setLocalError(null); }}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                isLoginMode
                  ? 'bg-gradient-to-r from-[#d4a940] to-[#f5d77e] text-[#0a1628] shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginMode(false); setLocalError(null); }}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                !isLoginMode
                  ? 'bg-gradient-to-r from-[#d4a940] to-[#f5d77e] text-[#0a1628] shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-[#d4a940]" />
              </div>
              <input
                id="input_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full py-4 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#d4a940] focus:ring-2 focus:ring-[#d4a940]/20 transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-[#d4a940]" />
              </div>
              <input
                id="input_password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full py-4 pl-12 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#d4a940] focus:ring-2 focus:ring-[#d4a940]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Confirm Password (Register Mode) */}
            {!isLoginMode && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-[#d4a940]" />
                </div>
                <input
                  id="input_confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi Password"
                  className="w-full py-4 pl-12 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#d4a940] focus:ring-2 focus:ring-[#d4a940]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}

            {/* Error Message */}
            {localError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm text-center">{localError}</p>
              </div>
            )}

            {/* Forgot Password (Login Mode) */}
            {isLoginMode && (
              <div className="text-right">
                <button type="button" className="text-[#d4a940] text-sm hover:underline">
                  Lupa Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="btn_login"
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-4 bg-gradient-to-r from-[#d4a940] to-[#f5d77e] text-[#0a1628] font-bold rounded-xl shadow-lg shadow-[#d4a940]/30 hover:shadow-xl hover:shadow-[#d4a940]/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0a1628]/20 border-t-[#0a1628] rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>{isLoginMode ? 'Masuk' : 'Daftar'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Demo Login Button */}
            <button
              id="btn_demo"
              type="button"
              onClick={onDemoLogin}
              className="w-full py-4 bg-white/5 border border-[#d4a940]/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-[#d4a940]" />
              <span>Coba Mode Demo</span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-white/40 text-sm">atau</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Switch Mode */}
          <p className="text-center text-white/60 text-sm">
            {isLoginMode ? 'Belum punya akun?' : 'Sudah punya akun?'}
            <button
              type="button"
              onClick={switchMode}
              className="ml-2 text-[#d4a940] font-semibold hover:underline"
            >
              {isLoginMode ? 'Daftar Sekarang' : 'Masuk'}
            </button>
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white/5 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#d4a940]" />
              </div>
              <p className="text-white/60 text-xs">Aman</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white/5 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#d4a940]" />
              </div>
              <p className="text-white/60 text-xs">Cepat</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white/5 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#d4a940]" />
              </div>
              <p className="text-white/60 text-xs">Premium</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 py-6 text-center">
        <p className="text-white/40 text-xs">
          © 2024 StableFlow. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginActivity;
