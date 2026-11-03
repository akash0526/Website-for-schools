import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  FlaskConical,
  LoaderCircle,
  LockKeyhole,
  Sprout,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { Brand, Spinner } from '../../components/ui';
export function LoginPage() {
  const { config, ready, user, login, loginDemo, resetPassword, error: authError } = useAuth(),
    { settings } = useSchool();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [showPassword, setShowPassword] = useState(false),
    [forgot, setForgot] = useState(false),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState('');
  const navigate = useNavigate(),
    location = useLocation();
  if (!ready) return <Spinner />;
  if (user) return <Navigate to="/admin" replace />;
  const from = (location.state as { from?: string } | null)?.from;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (forgot) {
        await resetPassword(email);
        setMessage(
          'If this email belongs to an administrator, a password recovery link will arrive shortly. Check your inbox and spam folder.',
        );
      } else if (config?.mode === 'demo') {
        await loginDemo();
        navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true });
      } else {
        await login(email, password);
        navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-page">
      <section className="login-story">
        <Link to="/">
          <Brand name={settings?.shortName || 'evergreen'} fullName="School workspace" light />
        </Link>
        <div className="login-story-content">
          <span className="eyebrow">YOUR SCHOOL. YOUR STORY.</span>
          <h1>
            Good things
            <br />
            grow with
            <br />a little care.
          </h1>
          <p>
            A simple place to share the moments, news, and possibilities that make your school
            special.
          </p>
          <div className="login-plant">
            <Sprout size={120} strokeWidth={0.8} />
            <span>
              Keep your community
              <br />
              part of the journey.
            </span>
          </div>
        </div>
        <span className="login-story-footer">Made for little minds and big possibilities.</span>
      </section>
      <section className="login-form-section">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Back to the school website
        </Link>
        <div className="login-form-wrap">
          <span className="login-lock">
            <LockKeyhole size={25} strokeWidth={1.5} />
          </span>
          <span className="eyebrow">THE SCHOOL WORKSPACE</span>
          <h2>{forgot ? 'A fresh start.' : 'Hello again.'}</h2>
          <p>
            {forgot
              ? 'Enter your administrator email and we’ll send a password recovery link.'
              : 'Sign in to keep your school’s story growing.'}
          </p>
          {config?.mode === 'demo' && (
            <div className="demo-login-note">
              <FlaskConical size={20} />
              <div>
                <strong>Take a look around.</strong>
                <span>This demo uses fictional content. No password needed.</span>
              </div>
            </div>
          )}
          <form onSubmit={submit}>
            {config?.mode !== 'demo' && (
              <>
                <label className="field">
                  School email
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    placeholder="you@yourschool.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                {!forgot && (
                  <label className="field">
                    Password
                    <div className="password-input">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="current-password"
                        placeholder="Your password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>
                )}
              </>
            )}
            {(error || authError) && (
              <div className="form-error" role="alert">
                {error || authError}
              </div>
            )}
            {message && (
              <div className="form-success" role="status">
                {message}
              </div>
            )}
            <button
              className="btn btn-primary btn-lg full-width"
              disabled={busy || !config}
              type="submit"
            >
              {busy ? (
                <LoaderCircle className="spin" size={19} />
              ) : config?.mode === 'demo' ? (
                <FlaskConical size={18} />
              ) : null}
              {busy
                ? 'Opening your workspace…'
                : config?.mode === 'demo'
                  ? 'Explore the admin demo'
                  : forgot
                    ? 'Send recovery link'
                    : 'Sign in to your school'}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>
          {config?.mode !== 'demo' && (
            <button
              className="login-forgot"
              onClick={() => {
                setForgot(!forgot);
                setError('');
                setMessage('');
              }}
            >
              {forgot ? 'Back to sign in' : 'Forgot your password?'}
            </button>
          )}
          <div className="login-security">
            <LockKeyhole size={13} />
            <span>
              {config?.mode === 'demo'
                ? 'Demo access · no real student or family data'
                : 'Protected access for authorized school staff only'}
            </span>
          </div>
        </div>
        <span className="login-bottom">Need access? Ask your school administrator.</span>
      </section>
    </div>
  );
}
export function ResetPasswordPage() {
  const { updatePassword, config } = useAuth(),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [done, setDone] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('The passwords don’t match.');
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="reset-page">
      <Brand />
      <div className="reset-card">
        <LockKeyhole size={32} />
        <h1>
          A new password.
          <br />A fresh start.
        </h1>
        {done ? (
          <>
            <p>Your password has been updated. You can now return to your school workspace.</p>
            <Link to="/admin" className="btn btn-primary">
              Go to my workspace
              <ArrowRight size={17} />
            </Link>
          </>
        ) : (
          <>
            <p>
              Open this page using the recovery link in your email. Choose a strong password with at
              least 12 characters.
            </p>
            {config?.mode === 'demo' && (
              <div className="form-error">
                Password recovery is only available in live mode with Supabase connected.
              </div>
            )}
            <form onSubmit={submit}>
              <label className="field">
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label className="field">
                Confirm new password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
              {error && <div className="form-error">{error}</div>}
              <button
                className="btn btn-primary full-width"
                disabled={busy || config?.mode === 'demo'}
              >
                {busy ? 'Updating…' : 'Update my password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
