import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Circle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Reusable stat card for left panel ────────────────────────

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '16px', padding: '16px 20px',
    }}>
      <div style={{ color: '#a78bfa', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '2px' }}>{label}</div>
    </div>
  );
}



// ── Animation variants ────────────────────────────────────────

const heroContainer = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// ── Main Component ────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email and password are required'); return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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
          style={{ position: 'relative', zIndex: 10, maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '28px' }}
        >
          <motion.div variants={heroItem}>
            <h1 style={{ color: '#fff', fontSize: '36px', fontWeight: 500, letterSpacing: '-0.03em', margin: '0 0 12px', lineHeight: 1.1 }}>
              Find the Right Talent.<br />Build the Right Future.
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.6, margin: 0, maxWidth: '300px' }}>
              FazeMate connects ambitious companies with skilled professionals through a modern, intelligent hiring platform designed for growth.
            </p>
          </motion.div>

          {/* Stats grid */}
          <motion.div variants={heroItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <StatCard value="2,000+" label="HR Teams" />
            <StatCard value="40%"    label="Faster Hiring" />
            <StatCard value="98%"    label="Satisfaction" />
            <StatCard value="500K+"  label="Candidates" />
          </motion.div>

          {/* Testimonial */}
          <motion.div variants={heroItem} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '16px', padding: '20px',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 14px' }}>
              "FazeMate cut our time-to-hire by 40%. The AI ranking alone is worth every penny."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#a78bfa,#6d28d9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '13px',
              }}>S</div>
              <div>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0 }}>Sarah Chen</p>
                <p style={{ color: '#a78bfa', fontSize: '12px', margin: 0 }}>Head of Talent, Acme Corp</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right: Login Form ── */}
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
              Welcome back
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Sign in to your FazeMate account.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)',
              borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#f87171',
            }}>
              {error}
            </div>
          )}



          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Email address</label>
              <input
                name="email" type="email" placeholder="you@company.com"
                value={form.email} onChange={handleChange} required
                style={inputStyle}
                onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.2)')}
                onBlur={e => (e.target.style.boxShadow = 'none')}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Password</label>
                <Link to="#" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  name="password" type={showPwd ? 'text' : 'password'} placeholder="Enter your password"
                  value={form.password} onChange={handleChange} required
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.2)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)', padding: 0,
                  display: 'flex', alignItems: 'center',
                }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#fff', cursor: 'pointer' }} />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Remember me for 30 days</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '52px', marginTop: '8px',
                background: loading ? 'rgba(255,255,255,0.7)' : '#fff',
                color: '#000', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s, transform 0.1s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#fff', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Create one free →
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}