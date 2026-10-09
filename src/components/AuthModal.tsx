import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { formatFirebaseAuthError } from '../firebase';

export const AuthModal: React.FC<AuthModalProps> = () => {
  const {
    authModalOpen,
    authModalTab,
    closeAuthModal,
    login,
    register,
    verifyModalOpen,
    closeVerifyModal,
    verifyEmail,
    resendVerification,
    verificationHint,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(authModalTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('Real Madrid');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync mode with tab
  React.useEffect(() => {
    setMode(authModalTab);
    setLocalError(null);
    clearAuthError();
    setSuccess(null);
  }, [authModalTab]);

  if (!authModalOpen && !verifyModalOpen) return null;

  const currentError = localError || authError;

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    setter(val);
    if (localError) setLocalError(null);
    if (authError) clearAuthError();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const msg = formatFirebaseAuthError(err);
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (password.length < 6) {
      setLocalError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        username: username.trim(),
        displayName: displayName.trim(),
        favoriteTeam,
      });
    } catch (err: unknown) {
      const msg = formatFirebaseAuthError(err);
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();
    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setSuccess(res.message);
      if (res.resetCodeHint) {
        setResetCode(res.resetCodeHint);
      }
      setMode('reset');
    } catch (err: unknown) {
      setLocalError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();
    setLoading(true);
    try {
      const res = await api.resetPassword({ email: email.trim(), code: resetCode, newPassword });
      setSuccess(res.message);
      setTimeout(() => {
        setMode('login');
        setSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      setLocalError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();
    setLoading(true);
    try {
      await verifyEmail(verifyCode);
    } catch (err: unknown) {
      setLocalError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const hint = await resendVerification();
      setSuccess(`Verification code generated: ${hint || 'Check your inbox'}`);
    } catch (err: unknown) {
      setLocalError(formatFirebaseAuthError(err));
    }
  };

  const quickFillAdmin = () => {
    setEmail('johnlsacc23332@gmail.com');
    setPassword('AdminSafePicks2026!');
  };

  // Verification Modal
  if (verifyModalOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-md rounded-3xl border border-blue-500/30 bg-neutral-900 p-6 text-white shadow-2xl shadow-blue-500/10">
          <button
            onClick={closeVerifyModal}
            className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Verify Your Email</h2>
            <p className="mt-1 text-xs text-neutral-400">
              Enter the 6-digit confirmation code to activate your account.
            </p>
          </div>

          {verificationHint && (
            <div className="mb-4 rounded-xl border border-blue-400/30 bg-blue-500/10 p-3 text-xs text-blue-300">
              <span className="font-semibold">Security Code:</span>{' '}
              <span className="font-mono text-sm tracking-wider font-bold text-blue-400">{verificationHint}</span>
              <button
                type="button"
                onClick={() => setVerifyCode(verificationHint)}
                className="ml-2 underline text-white hover:text-blue-200"
              >
                Auto-fill
              </button>
            </div>
          )}

          {currentError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{currentError}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 842190"
                className="w-full text-center tracking-widest font-mono text-2xl rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-blue-400 placeholder-neutral-600 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || verifyCode.length !== 6}
              className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Complete Verification'}
            </button>

            <div className="flex items-center justify-between text-xs text-neutral-400 pt-2">
              <button type="button" onClick={handleResend} className="hover:text-blue-400 transition-colors">
                Resend code
              </button>
              <button type="button" onClick={closeVerifyModal} className="hover:text-white transition-colors">
                Verify later
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-white shadow-2xl">
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switchers if login or register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex rounded-xl bg-neutral-950 p-1 mb-6 border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLocalError(null);
                clearAuthError();
              }}
              className={`flex-1 rounded-lg py-2.5 text-xs font-black transition-all ${
                mode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setLocalError(null);
                clearAuthError();
              }}
              className={`flex-1 rounded-lg py-2.5 text-xs font-black transition-all ${
                mode === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
            SAFE PICKS ARENA
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Join the Safe Arena'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset' && 'Set New Password'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {mode === 'login' && 'Real-time sports predictions, global chat, and live odds.'}
            {mode === 'register' && '100% Free Forever. Zero VIP tiers. True sports data.'}
            {mode === 'forgot' && 'Enter your email to receive a password reset token.'}
            {mode === 'reset' && 'Enter the reset code and your new password.'}
          </p>
        </div>

        {currentError && (
          <div className="mb-4 flex items-start justify-between gap-2 rounded-xl bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-400">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{currentError}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setLocalError(null);
                clearAuthError();
              }}
              className="text-red-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => handleInputChange(setEmail, e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-10 pr-4 py-3 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setLocalError(null);
                    clearAuthError();
                  }}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => handleInputChange(setPassword, e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-10 pr-4 py-3 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-black text-white transition-all hover:bg-blue-500 shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Log In to Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Admin Quick Credentials Button */}
            <div className="pt-2 border-t border-neutral-800 text-center">
              <button
                type="button"
                onClick={quickFillAdmin}
                className="text-xs text-blue-400/80 hover:text-blue-300 underline"
              >
                Auto-fill Admin Account (johnlsacc23332@gmail.com)
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => handleInputChange(setEmail, e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => handleInputChange(setUsername, e.target.value)}
                    placeholder="chelsea_fan"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => handleInputChange(setDisplayName, e.target.value)}
                  placeholder="Alex Rivers"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => handleInputChange(setPassword, e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Favorite Football Club
              </label>
              <select
                value={favoriteTeam}
                onChange={e => handleInputChange(setFavoriteTeam, e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="Real Madrid">Real Madrid</option>
                <option value="Barcelona">Barcelona</option>
                <option value="Arsenal">Arsenal</option>
                <option value="Manchester City">Manchester City</option>
                <option value="Liverpool">Liverpool</option>
                <option value="Chelsea">Chelsea</option>
                <option value="Manchester United">Manchester United</option>
                <option value="Bayern Munich">Bayern Munich</option>
                <option value="Inter Milan">Inter Milan</option>
                <option value="Paris Saint-Germain">Paris Saint-Germain</option>
                <option value="Other / Neutral">Other / Neutral Fan</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password || !username}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-black text-white transition-all hover:bg-blue-500 shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Register Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Your Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => handleInputChange(setEmail, e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-10 pr-4 py-3 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Sending Code...</span>
                </>
              ) : (
                'Request Reset Code'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLocalError(null);
                clearAuthError();
              }}
              className="w-full text-center text-xs text-neutral-400 hover:text-white"
            >
              Back to Login
            </button>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                6-Digit Reset Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={resetCode}
                onChange={e => handleInputChange(setResetCode, e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                New Password (min 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => handleInputChange(setNewPassword, e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !resetCode || !newPassword}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Updating Password...</span>
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

interface AuthModalProps {}
