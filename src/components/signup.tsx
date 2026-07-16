import { useState, FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Circle, Eye, EyeOff, Shield, ClipboardList, Mail, ArrowLeft } from 'lucide-react';
import { useAuth, type UserRole } from '../context/AuthContext';

// ── Reusable Components ───────────────────────────────────────

function StepItem({ number, text, active = false }: { number: number; text: string; active?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      borderRadius: '16px', padding: '12px 16px',
      background: active ? '#fff' : '#1A1A1A',
      border: active ? '1px solid #fff' : '1px solid transparent',
      color: active ? '#000' : '#fff',
    }}>
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
        fontSize: '12px', fontWeight: 600,
        background: active ? '#000' : 'rgba(255,255,255,0.10)',
        color: active ? '#fff' : 'rgba(255,255,255,0.4)',
      }}>
        {number}
      </span>
      <span style={{ fontSize: '14px', fontWeight: 500 }}>{text}</span>
    </div>
  );
}



// ── Animation variants ────────────────────────────────────────

const heroContainer = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const heroItem = {
  hidden:  { opacity: 0, y: 10 },
  show:    { opacity: 1, y: 0,  transition: { duration: 0.5, ease: 'easeOut' } },
};

// ── Main Component ────────────────────────────────────────────

export default function Signup() {
  const navigate   = useNavigate();
  const { signup, pendingVerification, pendingEmail, setPendingVerification } = useAuth();

  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [role, setRole]         = useState<UserRole>('candidate');
  const [form, setForm]         = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password) {
      setError('Please fill in all required fields'); return;
    }
    if (form.password.length < 8) {
      setError('Password requires at least 8 symbols'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      const res = await signup(form.email, form.password, `${form.firstName} ${form.lastName}`.trim(), role);
      if (res && res.needsVerification) {
        // UI will switch via context state
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <main className="auth-page">
        {/* Left: Hero + Video */}
        <div className="auth-hero">
          <video autoPlay muted loop playsInline style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          }}>
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4"
              type="video/mp4"
            />
          </video>
          {/* Brand logo at the top */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Circle size={20} fill="white" color="white" />
            <span style={{ color: '#fff', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em' }}>FazeMate</span>
          </div>

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: '36px', fontWeight: 500, letterSpacing: '-0.03em', margin: '0 0 12px', lineHeight: 1.1 }}>
                Verify your space
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                We sent a verification link to your email.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Verification Check Screen */}
        <div className="auth-form-panel">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="auth-form-inner"
            style={{ alignItems: 'center', textAlign: 'center' }}
          >
            {/* Mobile brand (visible only on small screens) */}
            <div className="auth-mobile-brand">
              <Circle size={20} fill="white" color="white" />
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em' }}>FazeMate</span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '80px', height: '80px', borderRadius: '24px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '8px', color: '#fff'
            }}>
              <Mail size={36} strokeWidth={1.5} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.03em', margin: 0, color: '#fff' }}>
                Check your email
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>
                We've sent a temporary verification link to <strong style={{ color: '#fff' }}>{pendingEmail}</strong>.
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>
                Click the link in the email to confirm your account, then you will be able to log in.
              </p>
            </div>

            <div style={{
              width: '100%', padding: '16px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'left', lineHeight: 1.6
            }}>
              <strong style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>Didn't receive the email?</strong>
              Check your spam folder or wait a couple of minutes.
            </div>

            <button
              onClick={() => setPendingVerification(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'none', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 500,
                cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
            >
              <ArrowLeft size={16} /> Back to Sign Up
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '0 16px', height: '44px',
    background: '#1A1A1A', border: 'none', borderRadius: '12px',
    color: '#fff', fontSize: '14px', outline: 'none',
  };

  return (
    <main className="auth-page">

      {/* ── Left: Hero + Video ── */}
      <div className="auth-hero">
        {/* Video — no overlay */}
        <video autoPlay muted loop playsInline style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        }}>
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4"
            type="video/mp4"
          />
        </video>

        {/* Brand logo at the top */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Circle size={20} fill="white" color="white" />
          <span style={{ color: '#fff', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em' }}>FazeMate</span>
        </div>

        {/* Hero content — staggered motion */}
        <motion.div
          variants={heroContainer} initial="hidden" animate="show"
          style={{ position: 'relative', zIndex: 10, maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '28px' }}
        >

          {/* Heading + subtitle */}
          <motion.div variants={heroItem}>
            <h1 style={{ color: '#fff', fontSize: '36px', fontWeight: 500, letterSpacing: '-0.03em', margin: '0 0 12px', lineHeight: 1.1 }}>
              Join FazeMate
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Follow these 3 quick phases to activate your space.
            </p>
          </motion.div>

          {/* Role picker */}
          <motion.div variants={heroItem}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>Sign up as:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="button" onClick={() => setRole('hr')} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px 4px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  background: role === 'hr' ? '#fff' : 'rgba(255,255,255,0.08)',
                  color: role === 'hr' ? '#000' : 'rgba(255,255,255,0.7)',
                  border: role === 'hr' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                  transition: 'all 0.2s',
                }}>
                  <Shield size={12} /> HR Manager
                </button>
                <button type="button" onClick={() => setRole('candidate')} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px 4px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  background: role === 'candidate' ? '#fff' : 'rgba(255,255,255,0.08)',
                  color: role === 'candidate' ? '#000' : 'rgba(255,255,255,0.7)',
                  border: role === 'candidate' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                  transition: 'all 0.2s',
                }}>
                  <ClipboardList size={12} /> Candidate
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right: Form ── */}
      <div className="auth-form-panel">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          className="auth-form-inner"
        >
          {/* Mobile brand (visible only on small screens) */}
          <div className="auth-mobile-brand">
            <Circle size={20} fill="white" color="white" />
            <span style={{ color: '#fff', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em' }}>FazeMate</span>
          </div>

          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.03em', margin: 0, color: '#fff' }}>
              Create New Profile
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Input your basic details to begin the journey.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#f87171' }}>
              {error}
            </div>
          )}



          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Name row */}
            <div className="auth-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>First Name</label>
                <input name="firstName" type="text" placeholder="John" value={form.firstName} onChange={handleChange} required style={inputStyle}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.2)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Last Name</label>
                <input name="lastName" type="text" placeholder="Doe" value={form.lastName} onChange={handleChange} style={inputStyle}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.2)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Email</label>
              <input name="email" type="email" placeholder="you@company.com" value={form.email} onChange={handleChange} required style={inputStyle}
                onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.2)')}
                onBlur={e => (e.target.style.boxShadow = 'none')}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPwd ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.2)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0,
                }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Requires at least 8 symbols.
              </p>
            </div>

            {/* Confirm password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Confirm Password</label>
              <input name="confirmPassword" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} required style={inputStyle}
                onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.2)')}
                onBlur={e => (e.target.style.boxShadow = 'none')}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '52px', marginTop: '8px',
                background: loading ? 'rgba(255,255,255,0.7)' : '#fff',
                color: '#000',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s, transform 0.1s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Member of the team?{' '}
            <Link to="/" style={{ color: '#fff', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}