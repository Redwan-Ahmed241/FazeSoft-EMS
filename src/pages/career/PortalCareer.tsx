import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Briefcase, MapPin, DollarSign, Clock, User, Lock, Mail, 
  Phone, Upload, X, ChevronDown, LogOut, FileText, CheckCircle2, 
  AlertCircle, Building2, Crosshair, ArrowRight, Send, Globe
} from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortal } from '../../context/PortalContext';
import './PortalCareer.css';

// Department color mapping
const DEPT_COLORS: Record<string, string> = {
  'Engineering': '#4A7BF7',
  'Design': '#E84393',
  'Product': '#00B894',
  'Marketing': '#FDCB6E',
  'Analytics': '#6C5CE7',
  'Sales': '#FF7675',
  'HR': '#00CEC9',
  'Finance': '#2D3436',
};

function getDeptColor(dept: string) {
  return DEPT_COLORS[dept] || '#4A7BF7';
}

function getDeptInitials(dept: string) {
  return dept ? dept.slice(0, 2).toUpperCase() : 'JB';
}

function InitialsCircle({ name, size = 32 }: { name: string; size?: number }) {
  const words = name.trim().split(/\s+/);
  const initials = words.slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
  return (
    <div 
      className="portal-user-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || 'U'}
    </div>
  );
}

export function PortalCareer() {
  const { candidate, isAuthenticated, login, signup, logout, updateProfile } = usePortalAuth();
  const { jobs, applications, isLoading, applyToJob } = usePortal();

  // Search & Filter State
  const [whatQuery, setWhatQuery] = useState('');
  const [whereQuery, setWhereQuery] = useState('');
  const [activeDeptFilter, setActiveDeptFilter] = useState('All');

  // UI state
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showApplyModal, setShowApplyModal] = useState<any | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMyApps, setShowMyApps] = useState(false);

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Profile form
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profLoc, setProfLoc] = useState('');
  const [profSkills, setProfSkills] = useState('');
  const [profSuccess, setProfSuccess] = useState('');
  const [profError, setProfError] = useState('');

  // Application upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [applyError, setApplyError] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Sync profile when modal opens
  useEffect(() => {
    if (candidate) {
      setProfName(candidate.fullName);
      setProfPhone(candidate.phone);
      setProfLoc(candidate.location);
      setProfSkills(candidate.skills);
    }
  }, [candidate, showProfileModal]);

  // Unique departments for filter pills
  const departments = ['All', ...Array.from(new Set(jobs.map(j => j.department).filter(Boolean)))];

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesWhat = whatQuery.trim() === '' || 
      job.title.toLowerCase().includes(whatQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(whatQuery.toLowerCase()) ||
      (job.description || '').toLowerCase().includes(whatQuery.toLowerCase());
    const matchesWhere = whereQuery.trim() === '' ||
      job.location.toLowerCase().includes(whereQuery.toLowerCase());
    const matchesDept = activeDeptFilter === 'All' || job.department === activeDeptFilter;
    return matchesWhat && matchesWhere && matchesDept;
  });

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await signup(fullName, email, password, phone, location, skills);
      }
      setShowAuthModal(false);
      setEmail(''); setPassword(''); setFullName('');
      setPhone(''); setLocation(''); setSkills('');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfError('');
    setProfSuccess('');
    try {
      await updateProfile({ fullName: profName, phone: profPhone, location: profLoc, skills: profSkills });
      setProfSuccess('Profile updated successfully!');
      setTimeout(() => setProfSuccess(''), 3000);
    } catch (err: any) {
      setProfError(err.message || 'Failed to update profile');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setApplyError('');
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setApplyError('Please upload your resume file.');
      return;
    }
    setApplyError('');
    setApplyLoading(true);
    try {
      await applyToJob(candidate!.id, showApplyModal.id, selectedFile.name);
      setApplySuccess(true);
      setSelectedFile(null);
      setTimeout(() => { setApplySuccess(false); setShowApplyModal(null); }, 2500);
    } catch (err: any) {
      setApplyError(err.message || 'Application submission failed.');
    } finally {
      setApplyLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Applied': return 'portal-status-badge portal-status-applied';
      case 'Under Review': return 'portal-status-badge portal-status-review';
      case 'Shortlisted': return 'portal-status-badge portal-status-shortlisted';
      case 'Selected': return 'portal-status-badge portal-status-selected';
      case 'Rejected': return 'portal-status-badge portal-status-rejected';
      default: return 'portal-status-badge';
    }
  };

  const myApplications = candidate ? applications.filter(app => app.candidateId === candidate.id) : [];

  const handleApplyClick = (job: any) => {
    if (isAuthenticated) {
      setShowApplyModal(job);
    } else {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const posted = new Date(dateStr);
    const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="portal-career-root">

      {/* ─── Navbar ─── */}
      <nav className="portal-navbar">
        <div className="portal-navbar-inner">

          <div className="portal-logo-group">
            <div className="portal-logo-icon">
              <Briefcase style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <span className="portal-logo-text">FazeMate</span>
          </div>

          <div className="portal-nav-links">
            <button className="portal-nav-link active">
              <Search style={{ width: 15, height: 15 }} /> Search Jobs
            </button>
            {isAuthenticated && (
              <button className="portal-nav-link" onClick={() => setShowMyApps(true)}>
                <FileText style={{ width: 15, height: 15 }} /> My Applications
              </button>
            )}
          </div>

          <div className="portal-nav-actions">
            {isAuthenticated && candidate ? (
              <>
                <button className="portal-user-pill" onClick={() => setShowProfileModal(true)}>
                  <InitialsCircle name={candidate.fullName} size={32} />
                  <span className="portal-user-name">{candidate.fullName.split(' ')[0]}</span>
                </button>
                <button className="portal-btn-logout" onClick={logout} title="Sign Out">
                  <LogOut style={{ width: 16, height: 16 }} />
                </button>
              </>
            ) : (
              <>
                <button className="portal-btn-cv" onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}>
                  <Upload style={{ width: 15, height: 15 }} /> Post your CV
                </button>
                <button className="portal-btn-signin" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero Search ─── */}
      <section className="portal-hero-section">
        <div className="portal-hero-inner">
          <h1 className="portal-hero-title">
            Find your next <span>career</span> opportunity
          </h1>

          <div className="portal-search-box">
            <div className="portal-search-field">
              <span className="portal-search-label">
                <Briefcase style={{ width: 16, height: 16 }} /> What
              </span>
              <input
                type="text"
                className="portal-search-input"
                placeholder="Job title, keywords or company"
                value={whatQuery}
                onChange={e => setWhatQuery(e.target.value)}
              />
            </div>
            <div className="portal-search-field">
              <span className="portal-search-label">
                <MapPin style={{ width: 16, height: 16 }} /> Where
              </span>
              <input
                type="text"
                className="portal-search-input"
                placeholder="Town or region"
                value={whereQuery}
                onChange={e => setWhereQuery(e.target.value)}
              />
              <button className="portal-search-location-btn" title="Use current location">
                <Crosshair style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <button 
              className="portal-search-submit"
              onClick={() => { /* triggers filter via state */ }}
            >
              Search
            </button>
          </div>

          <div className="portal-job-count">
            <strong>{filteredJobs.length}</strong> {filteredJobs.length === 1 ? 'job' : 'jobs'} published
            {(whatQuery || whereQuery) && ' matching your search'}
          </div>
        </div>
      </section>

      {/* ─── Quick Action Cards ─── */}
      <div className="portal-quick-actions">
        <div 
          className="portal-action-card"
          onClick={() => {
            if (isAuthenticated) {
              setShowProfileModal(true);
            } else {
              setAuthMode('signup');
              setShowAuthModal(true);
            }
          }}
        >
          <div className="portal-action-card-content">
            <h3>{isAuthenticated ? 'My Profile' : 'Upload your CV'}</h3>
            <p>{isAuthenticated ? 'View and edit your profile details' : 'Find your dream job with FazeMate'}</p>
          </div>
          <div className="portal-action-card-icon">
            <Upload style={{ width: 24, height: 24 }} />
          </div>
        </div>
        <div 
          className="portal-action-card"
          onClick={() => window.open('/dashboard', '_blank')}
        >
          <div className="portal-action-card-content">
            <h3>Post a job</h3>
            <p>Find the perfect candidate</p>
          </div>
          <div className="portal-action-card-icon">
            <Send style={{ width: 24, height: 24 }} />
          </div>
        </div>
      </div>

      {/* ─── Job Listings ─── */}
      <section className="portal-listings-section">

        <div className="portal-section-header">
          <h2 className="portal-section-title">Latest Jobs</h2>
          <div className="portal-filter-pills">
            {departments.map(d => (
              <button
                key={d}
                className={`portal-filter-pill ${activeDeptFilter === d ? 'active' : ''}`}
                onClick={() => setActiveDeptFilter(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="portal-empty-state">
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '40px 0' }}>
              <span className="portal-loading-dot" />
              <span className="portal-loading-dot" />
              <span className="portal-loading-dot" />
            </div>
            <p>Loading opportunities...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="portal-empty-state">
            <div className="portal-empty-icon">
              <Building2 style={{ width: 28, height: 28, color: '#4A7BF7' }} />
            </div>
            <h3>No jobs found</h3>
            <p>Try broadening your search criteria or check back later for new listings.</p>
          </div>
        ) : (
          <div className="portal-jobs-grid">
            {filteredJobs.map(job => (
              <div 
                key={job.id}
                className="portal-job-row"
                onClick={() => setSelectedJob(job)}
              >
                <div 
                  className="portal-job-row-icon"
                  style={{ backgroundColor: getDeptColor(job.department) }}
                >
                  {getDeptInitials(job.department)}
                </div>
                <div className="portal-job-row-body">
                  <h3 className="portal-job-row-title">{job.title}</h3>
                  <div className="portal-job-row-meta">
                    <span className="portal-job-row-meta-item">
                      <Building2 style={{ width: 13, height: 13 }} /> {job.department}
                    </span>
                    <span className="portal-job-row-meta-item">
                      <MapPin style={{ width: 13, height: 13 }} /> {job.location}
                    </span>
                    <span className="portal-job-row-meta-item">
                      <Clock style={{ width: 13, height: 13 }} /> {timeAgo(job.postedDate)}
                    </span>
                  </div>
                </div>
                <div className="portal-job-row-actions">
                  <span className="portal-badge-type">{job.type}</span>
                  <span className="portal-badge-salary">{job.salary}</span>
                  <button 
                    className="portal-btn-apply-row"
                    onClick={(e) => { e.stopPropagation(); handleApplyClick(job); }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Footer ─── */}
      <footer className="portal-footer">
        <div className="portal-footer-inner">
          <div className="portal-footer-brand">
            <span className="portal-footer-brand-name">FazeMate</span>
            <span className="portal-footer-brand-tagline">
              FazeMate — Connecting Talent with Opportunity.<br/>
              Streamlining talent acquisition.
            </span>
          </div>
          <div className="portal-footer-column">
            <h4>Job Seekers</h4>
            <a href="#">Search jobs</a>
            <a href="#">Post your CV</a>
            <a href="#">Career advice</a>
          </div>
          <div className="portal-footer-column">
            <h4>Recruiters</h4>
            <a href="/dashboard">Post a job</a>
            <a href="/dashboard">HR Dashboard</a>
          </div>
          <div className="portal-footer-column">
            <h4>Company</h4>
            <a href="#">About us</a>
            <a href="#">Contact</a>
            <a href="#">FAQs</a>
          </div>
          <div className="portal-footer-column">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* ════════════════ MODALS ════════════════ */}

      {/* 1. Job Details Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="portal-modal-overlay" onClick={() => setSelectedJob(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="portal-modal-box portal-modal-box-lg"
              onClick={e => e.stopPropagation()}
            >
              <button className="portal-modal-close" onClick={() => setSelectedJob(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div 
                  className="portal-job-row-icon"
                  style={{ backgroundColor: getDeptColor(selectedJob.department), width: 52, height: 52, fontSize: '1.1rem' }}
                >
                  {getDeptInitials(selectedJob.department)}
                </div>
                <div>
                  <h2 className="portal-modal-title">{selectedJob.title}</h2>
                  <p className="portal-modal-subtitle" style={{ margin: 0 }}>{selectedJob.department}</p>
                </div>
              </div>

              <div className="portal-detail-tags">
                <span className="portal-detail-tag">
                  <MapPin style={{ width: 14, height: 14 }} /> {selectedJob.location}
                </span>
                <span className="portal-detail-tag">
                  <DollarSign style={{ width: 14, height: 14 }} /> {selectedJob.salary}
                </span>
                <span className="portal-detail-tag">
                  <Clock style={{ width: 14, height: 14 }} /> {selectedJob.type}
                </span>
                <span className="portal-detail-tag">
                  <Globe style={{ width: 14, height: 14 }} /> Posted {timeAgo(selectedJob.postedDate)}
                </span>
              </div>

              <div style={{ borderTop: '1px solid #e8eaed', margin: '20px 0', padding: 0 }} />

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px', color: '#1a1a2e' }}>Job Description</h3>
                <p style={{ fontSize: '0.875rem', color: '#5f6368', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>
                  {selectedJob.description || 'No description provided.'}
                </p>
              </div>

              {selectedJob.requirements && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px', color: '#1a1a2e' }}>Requirements</h3>
                  <p style={{ fontSize: '0.875rem', color: '#5f6368', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>
                    {selectedJob.requirements}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e8eaed' }}>
                <button className="portal-btn-outline" onClick={() => setSelectedJob(null)}>
                  Close
                </button>
                <button 
                  className="portal-btn-primary"
                  style={{ width: 'auto' }}
                  onClick={() => {
                    setSelectedJob(null);
                    handleApplyClick(selectedJob);
                  }}
                >
                  Apply Now <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Auth Modal (Login/Register) */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="portal-modal-overlay" onClick={() => setShowAuthModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="portal-modal-box"
              onClick={e => e.stopPropagation()}
            >
              <button className="portal-modal-close" onClick={() => setShowAuthModal(false)}>
                <X style={{ width: 18, height: 18 }} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'linear-gradient(135deg, #4A7BF7, #3B6CE7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(74, 123, 247, 0.25)'
                }}>
                  {authMode === 'login' ? <Lock style={{ width: 20, height: 20, color: '#fff' }} /> : <User style={{ width: 20, height: 20, color: '#fff' }} />}
                </div>
                <h2 className="portal-modal-title">
                  {authMode === 'login' ? 'Welcome back' : 'Create your profile'}
                </h2>
                <p className="portal-modal-subtitle" style={{ margin: '4px 0 0' }}>
                  {authMode === 'login' ? 'Sign in to apply for jobs and track your applications.' : 'Register to start applying for positions.'}
                </p>
              </div>

              {authError && (
                <div className="portal-alert portal-alert-error">
                  <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit}>
                {authMode === 'signup' && (
                  <div className="portal-form-group">
                    <label className="portal-form-label">Full Name</label>
                    <input 
                      type="text" required className="portal-form-input"
                      value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Anisur Rahman"
                    />
                  </div>
                )}

                <div className="portal-form-group">
                  <label className="portal-form-label">Email Address</label>
                  <input 
                    type="email" required className="portal-form-input"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>

                <div className="portal-form-group">
                  <label className="portal-form-label">Password</label>
                  <input 
                    type="password" required className="portal-form-input"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                {authMode === 'signup' && (
                  <>
                    <div className="portal-form-row">
                      <div className="portal-form-group">
                        <label className="portal-form-label">Phone</label>
                        <input 
                          type="text" className="portal-form-input"
                          value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="+880..."
                        />
                      </div>
                      <div className="portal-form-group">
                        <label className="portal-form-label">Location</label>
                        <input 
                          type="text" className="portal-form-input"
                          value={location} onChange={e => setLocation(e.target.value)}
                          placeholder="Dhaka, BD"
                        />
                      </div>
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-form-label">Skills (comma-separated)</label>
                      <input 
                        type="text" className="portal-form-input"
                        value={skills} onChange={e => setSkills(e.target.value)}
                        placeholder="React, Node.js, Git..."
                      />
                    </div>
                  </>
                )}

                <button 
                  type="submit" disabled={authLoading}
                  className="portal-btn-primary" style={{ marginTop: 8 }}
                >
                  {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #e8eaed', fontSize: '0.875rem', color: '#9aa0a6' }}>
                {authMode === 'login' ? (
                  <>Don't have an account? <button className="portal-btn-text-link" onClick={() => setAuthMode('signup')}>Register</button></>
                ) : (
                  <>Already have a profile? <button className="portal-btn-text-link" onClick={() => setAuthMode('login')}>Sign In</button></>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Apply/Upload Resume Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="portal-modal-overlay" onClick={() => !applyLoading && setShowApplyModal(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="portal-modal-box"
              onClick={e => e.stopPropagation()}
            >
              <button className="portal-modal-close" onClick={() => setShowApplyModal(null)} disabled={applyLoading}>
                <X style={{ width: 18, height: 18 }} />
              </button>

              <h2 className="portal-modal-title">Apply for Position</h2>
              <p className="portal-modal-subtitle">
                Uploading resume for <strong style={{ color: '#1a1a2e' }}>{showApplyModal.title}</strong>
              </p>

              {applySuccess ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', border: '2px solid #a7f3d0'
                  }}>
                    <CheckCircle2 style={{ width: 28, height: 28, color: '#059669' }} />
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>Application Submitted!</h3>
                  <p style={{ fontSize: '0.875rem', color: '#9aa0a6', margin: 0 }}>Track your application status from "My Applications".</p>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit}>
                  {applyError && (
                    <div className="portal-alert portal-alert-error">
                      <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                      <span>{applyError}</span>
                    </div>
                  )}

                  <div className="portal-upload-zone">
                    <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
                    <Upload style={{ width: 32, height: 32, color: '#4A7BF7' }} />
                    <h4>{selectedFile ? selectedFile.name : 'Upload your Resume'}</h4>
                    <p>{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, Word, or TXT formats (Max 5MB)'}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button type="button" className="portal-btn-outline" onClick={() => setShowApplyModal(null)} disabled={applyLoading}>
                      Cancel
                    </button>
                    <button type="submit" className="portal-btn-primary" style={{ width: 'auto' }} disabled={applyLoading}>
                      {applyLoading ? 'Uploading...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Edit Profile Modal */}
      <AnimatePresence>
        {showProfileModal && candidate && (
          <div className="portal-modal-overlay" onClick={() => setShowProfileModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="portal-modal-box"
              onClick={e => e.stopPropagation()}
            >
              <button className="portal-modal-close" onClick={() => setShowProfileModal(false)}>
                <X style={{ width: 18, height: 18 }} />
              </button>

              <h2 className="portal-modal-title">Edit Profile</h2>
              <p className="portal-modal-subtitle">Keep your details updated for recruiters.</p>

              <form onSubmit={handleProfileUpdate}>
                {profSuccess && <div className="portal-alert portal-alert-success"><CheckCircle2 style={{ width: 16, height: 16 }} /><span>{profSuccess}</span></div>}
                {profError && <div className="portal-alert portal-alert-error"><AlertCircle style={{ width: 16, height: 16 }} /><span>{profError}</span></div>}

                <div className="portal-form-group">
                  <label className="portal-form-label">Full Name</label>
                  <input type="text" required className="portal-form-input" value={profName} onChange={e => setProfName(e.target.value)} />
                </div>
                <div className="portal-form-group">
                  <label className="portal-form-label">Email (Unchangeable)</label>
                  <input type="email" disabled className="portal-form-input" value={candidate.email} />
                </div>
                <div className="portal-form-row">
                  <div className="portal-form-group">
                    <label className="portal-form-label">Phone</label>
                    <input type="text" className="portal-form-input" value={profPhone} onChange={e => setProfPhone(e.target.value)} />
                  </div>
                  <div className="portal-form-group">
                    <label className="portal-form-label">Location</label>
                    <input type="text" className="portal-form-input" value={profLoc} onChange={e => setProfLoc(e.target.value)} />
                  </div>
                </div>
                <div className="portal-form-group">
                  <label className="portal-form-label">Skills (comma-separated)</label>
                  <input type="text" className="portal-form-input" value={profSkills} onChange={e => setProfSkills(e.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button type="button" className="portal-btn-outline" onClick={() => setShowProfileModal(false)}>Close</button>
                  <button type="submit" className="portal-btn-primary" style={{ width: 'auto' }}>Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. My Applications Modal */}
      <AnimatePresence>
        {showMyApps && isAuthenticated && (
          <div className="portal-modal-overlay" onClick={() => setShowMyApps(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="portal-modal-box portal-modal-box-lg"
              onClick={e => e.stopPropagation()}
            >
              <button className="portal-modal-close" onClick={() => setShowMyApps(false)}>
                <X style={{ width: 18, height: 18 }} />
              </button>

              <h2 className="portal-modal-title">My Applications</h2>
              <p className="portal-modal-subtitle">Track the status of your job applications.</p>

              {myApplications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <FileText style={{ width: 40, height: 40, color: '#e8eaed', margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ fontSize: '0.875rem', color: '#9aa0a6' }}>You haven't submitted any applications yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {myApplications.map(app => (
                    <div key={app.id} className="portal-app-track-item">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="portal-app-track-title">{app.jobTitle}</p>
                        <p className="portal-app-track-date">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <span className={getStatusClass(app.applicationStatus)}>
                        {app.applicationStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
