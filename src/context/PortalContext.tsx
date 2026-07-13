import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePortalAuth } from './PortalAuthContext';

export interface PortalJob {
  id: number;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string;
  status: string;
  postedDate: string;
}

export interface PortalApplication {
  id: number;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateLocation: string;
  candidateSkills: string;
  jobId: number;
  jobTitle: string;
  resumeUrl: string;
  applicationStatus: string;
  appliedAt: string;
}

interface PortalContextType {
  jobs: PortalJob[];
  applications: PortalApplication[];
  isLoading: boolean;
  applyToJob: (candidateId: string, jobId: number, resumeName: string) => Promise<void>;
  updateApplicationStatus: (applicationId: number, newStatus: string) => Promise<void>;
  bulkResumeUpload: (files: File[], jobId: number) => Promise<void>;
  refreshApplications: () => Promise<void>;
  refreshJobs: () => Promise<void>;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

const USE_SUPABASE = !!import.meta.env.VITE_SUPABASE_URL;
const LS_PORTAL_APPLICATIONS = 'hiremate_portal_applications';
const LS_PORTAL_CANDIDATES = 'hiremate_portal_candidates';
const LS_JOBS = 'hiremate_jobs';

const MOCK_PROFILES = [
  { name: "Anisur Rahman", email: "anisur@example.com", phone: "+8801711223344", location: "Dhaka, Bangladesh", skills: "React, TypeScript, Node.js, Tailwind CSS, REST APIs" },
  { name: "Fahmida Chowdhury", email: "fahmida@example.com", phone: "+8801811556677", location: "Chittagong, Bangladesh", skills: "Figma, UI/UX Design, Adobe XD, Wireframing, User Research" },
  { name: "Rashedul Bari", email: "rashed@example.com", phone: "+8801911889900", location: "Sylhet, Bangladesh", skills: "Python, Django, PostgreSQL, Docker, AWS, Git" },
  { name: "Tasnim Sultana", email: "tasnim@example.com", phone: "+8801511223344", location: "Dhaka, Bangladesh", skills: "Product Strategy, Agile, Scrum, Jira, Product Roadmap, Product Analytics" },
  { name: "Kazi Ashraful", email: "ashraful@example.com", phone: "+8801611556677", location: "Rajshahi, Bangladesh", skills: "Java, Spring Boot, MySQL, Hibernate, Microservices, Git" }
];

export const PortalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { candidate } = usePortalAuth();
  const [jobs, setJobs] = useState<PortalJob[]>([]);
  const [applications, setApplications] = useState<PortalApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load active jobs — try Supabase first, fall back to localStorage
  const loadLocalJobs = (): PortalJob[] => {
    const stored = localStorage.getItem(LS_JOBS);
    if (stored) {
      const allJobs = JSON.parse(stored);
      return allJobs
        .filter((j: any) => j.status === 'Active')
        .map((j: any) => ({
          id: j.id,
          title: j.title,
          department: j.department || '',
          location: j.location || 'Remote',
          type: j.employment_type || j.type || 'Full-time',
          salary: j.salary_range || j.salary || 'Competitive',
          description: j.description || '',
          requirements: j.requirements || '',
          status: j.status || 'Active',
          postedDate: j.postedDate || j.created_at?.split?.('T')?.[0] || new Date().toISOString().split('T')[0]
        }));
    }
    return [];
  };

  const fetchJobs = async () => {
    let supabaseJobs: PortalJob[] = [];

    if (USE_SUPABASE) {
      try {
        const { supabase } = await import('../utils/supabase');
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'Active')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          supabaseJobs = data.map((j: any) => ({
            id: j.id,
            title: j.title,
            department: j.department || '',
            location: j.location || 'Remote',
            type: j.employment_type || j.type || 'Full-time',
            salary: j.salary_range || j.salary || 'Competitive',
            description: j.description || '',
            requirements: j.requirements || '',
            status: j.status || 'Active',
            postedDate: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }));
        } else if (error) {
          console.warn('Supabase jobs query failed (likely RLS), falling back to localStorage:', error.message);
        }
      } catch (err) {
        console.warn('Supabase connection error, falling back to localStorage:', err);
      }
    }

    // If Supabase returned data, use it; otherwise fall back to localStorage
    if (supabaseJobs.length > 0) {
      setJobs(supabaseJobs);
    } else {
      const localJobs = loadLocalJobs();
      if (localJobs.length > 0) {
        setJobs(localJobs);
      } else {
        // No jobs from either source — set empty (no hardcoded mock data)
        setJobs([]);
      }
    }
  };

  // Load all applications (mapped with candidate details)
  const fetchApplications = async () => {
    try {
      if (USE_SUPABASE) {
        const { supabase } = await import('../utils/supabase');
        // Fetch applications joining portal_candidates
        const { data, error } = await supabase
          .from('portal_job_applications')
          .select('*, portal_candidates(*)');

        if (error) throw new Error(error.message);

        // Fetch jobs to map names locally just in case
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('id, title');
        
        const jobMap: Record<number, string> = {};
        if (jobsData) {
          jobsData.forEach((j: any) => {
            jobMap[j.id] = j.title;
          });
        }

        const mapped: PortalApplication[] = (data || []).map((app: any) => ({
          id: app.id,
          candidateId: app.candidate_id,
          candidateName: app.portal_candidates?.full_name || 'Unknown',
          candidateEmail: app.portal_candidates?.email || '',
          candidatePhone: app.portal_candidates?.phone || '',
          candidateLocation: app.portal_candidates?.location || '',
          candidateSkills: app.portal_candidates?.skills || '',
          jobId: app.job_id,
          jobTitle: jobMap[app.job_id] || 'Unknown Position',
          resumeUrl: app.resume_url || '',
          applicationStatus: app.application_status || 'Applied',
          appliedAt: app.applied_at || new Date().toISOString(),
        }));
        setApplications(mapped);
      } else {
        const storedApps = JSON.parse(localStorage.getItem(LS_PORTAL_APPLICATIONS) || '[]');
        const storedCandidates = JSON.parse(localStorage.getItem(LS_PORTAL_CANDIDATES) || '[]');
        const storedJobs = JSON.parse(localStorage.getItem(LS_JOBS) || '[]');

        const candidateMap: Record<string, any> = {};
        storedCandidates.forEach((c: any) => {
          candidateMap[c.id] = c;
        });

        const jobMap: Record<number, string> = {};
        storedJobs.forEach((j: any) => {
          jobMap[j.id] = j.title;
        });

        const mapped: PortalApplication[] = storedApps.map((app: any) => {
          const candidateDetails = candidateMap[app.candidateId] || {};
          return {
            id: app.id,
            candidateId: app.candidateId,
            candidateName: candidateDetails.fullName || 'Unknown',
            candidateEmail: candidateDetails.email || '',
            candidatePhone: candidateDetails.phone || '',
            candidateLocation: candidateDetails.location || '',
            candidateSkills: candidateDetails.skills || '',
            jobId: app.jobId,
            jobTitle: jobMap[app.jobId] || 'Unknown Position',
            resumeUrl: app.resumeUrl || '',
            applicationStatus: app.applicationStatus || 'Applied',
            appliedAt: app.appliedAt || new Date().toISOString()
          };
        });
        setApplications(mapped);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await fetchJobs();
      await fetchApplications();
      setIsLoading(false);
    };
    loadAll();
  }, []);

  const applyToJob = async (candidateId: string, jobId: number, resumeName: string) => {
    try {
      if (USE_SUPABASE) {
        const { supabase } = await import('../utils/supabase');
        // Check if application already exists
        const { data: existing } = await supabase
          .from('portal_job_applications')
          .select('id')
          .eq('candidate_id', candidateId)
          .eq('job_id', jobId)
          .maybeSingle();

        if (existing) throw new Error('You have already applied for this job.');

        const { error } = await supabase
          .from('portal_job_applications')
          .insert([{
            candidate_id: candidateId,
            job_id: jobId,
            resume_url: resumeName,
            application_status: 'Applied'
          }]);

        if (error) throw new Error(error.message);
      } else {
        const storedApps = JSON.parse(localStorage.getItem(LS_PORTAL_APPLICATIONS) || '[]');
        const existing = storedApps.find((app: any) => app.candidateId === candidateId && app.jobId === jobId);
        
        if (existing) throw new Error('You have already applied for this job.');

        const newApp = {
          id: Date.now() + Math.floor(Math.random() * 100),
          candidateId,
          jobId,
          resumeUrl: resumeName,
          applicationStatus: 'Applied',
          appliedAt: new Date().toISOString()
        };
        storedApps.push(newApp);
        localStorage.setItem(LS_PORTAL_APPLICATIONS, JSON.stringify(storedApps));
      }
      await fetchApplications();
    } catch (err) {
      console.error('Error applying to job:', err);
      throw err;
    }
  };

  const updateApplicationStatus = async (applicationId: number, newStatus: string) => {
    try {
      if (USE_SUPABASE) {
        const { supabase } = await import('../utils/supabase');
        const { error } = await supabase
          .from('portal_job_applications')
          .update({ application_status: newStatus })
          .eq('id', applicationId);

        if (error) throw new Error(error.message);
      } else {
        const storedApps = JSON.parse(localStorage.getItem(LS_PORTAL_APPLICATIONS) || '[]');
        const idx = storedApps.findIndex((app: any) => app.id === applicationId);
        if (idx !== -1) {
          storedApps[idx].applicationStatus = newStatus;
          localStorage.setItem(LS_PORTAL_APPLICATIONS, JSON.stringify(storedApps));
        }
      }
      await fetchApplications();
    } catch (err) {
      console.error('Error updating application status:', err);
      throw err;
    }
  };

  const bulkResumeUpload = async (files: File[], jobId: number) => {
    try {
      const { supabase } = await import('../utils/supabase');
      
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i];
        
        // Match a mock profile from our list, using index or randomized
        const mockProfileIndex = (Date.now() + i) % MOCK_PROFILES.length;
        const baseMock = MOCK_PROFILES[mockProfileIndex];

        // Create customized details using file name prefix or timestamp
        const timestamp = Date.now() + i;
        const candidateEmail = `${baseMock.email.split('@')[0]}_${timestamp}@example.com`;
        const candidateName = `${baseMock.name}`;

        if (USE_SUPABASE) {
          // 1. Create candidate account
          const { data: newCand, error: candError } = await supabase
            .from('portal_candidates')
            .insert([{
              full_name: candidateName,
              email: candidateEmail,
              password: 'password123', // auto generated temp password
              phone: baseMock.phone,
              location: baseMock.location,
              skills: baseMock.skills
            }])
            .select()
            .single();

          if (candError) {
            console.error('Failed to create candidate for bulk upload:', candError);
            continue;
          }

          // 2. Submit job application
          const { error: appError } = await supabase
            .from('portal_job_applications')
            .insert([{
              candidate_id: newCand.id,
              job_id: jobId,
              resume_url: file.name,
              application_status: 'Applied'
            }]);

          if (appError) {
            console.error('Failed to create application for bulk upload:', appError);
          }
        } else {
          // LocalStorage fallback
          const candidates = JSON.parse(localStorage.getItem(LS_PORTAL_CANDIDATES) || '[]');
          const storedApps = JSON.parse(localStorage.getItem(LS_PORTAL_APPLICATIONS) || '[]');

          const newId = Math.random().toString(36).substring(2, 9);
          candidates.push({
            id: newId,
            fullName: candidateName,
            email: candidateEmail,
            password: 'password123',
            phone: baseMock.phone,
            location: baseMock.location,
            skills: baseMock.skills
          });
          localStorage.setItem(LS_PORTAL_CANDIDATES, JSON.stringify(candidates));

          storedApps.push({
            id: Date.now() + i + Math.floor(Math.random() * 100),
            candidateId: newId,
            jobId,
            resumeUrl: file.name,
            applicationStatus: 'Applied',
            appliedAt: new Date().toISOString()
          });
          localStorage.setItem(LS_PORTAL_APPLICATIONS, JSON.stringify(storedApps));
        }
      }
      await fetchApplications();
    } catch (err) {
      console.error('Error in bulk resume upload:', err);
      throw err;
    }
  };

  return (
    <PortalContext.Provider value={{
      jobs,
      applications,
      isLoading,
      applyToJob,
      updateApplicationStatus,
      bulkResumeUpload,
      refreshApplications: fetchApplications,
      refreshJobs: fetchJobs
    }}>
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) throw new Error('usePortal must be used within a PortalProvider');
  return context;
};
