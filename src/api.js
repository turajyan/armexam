const BASE = '/api';

function getToken() {
  try { return localStorage.getItem('armexam_token') || ''; } catch { return ''; }
}

function getAdminToken() {
  try { return localStorage.getItem('armexam_admin_token') || ''; } catch { return ''; }
}

async function req(url, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + url, { headers, ...opts });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function adminReq(url, opts = {}) {
  const token = getAdminToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + url, { headers, ...opts });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // ── Student Auth ─────────────────────────────────────────────────────────────
  register:   (data) => req('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login:      (data) => req('/auth/login',    { method: 'POST', body: JSON.stringify(data) }),
  me:         ()     => req('/auth/me'),
  getStudentStats: () => req('/student/stats'),
  studentStats: () => req('/student/stats'),
  getMedia:         () => adminReq("/media"),
  deleteMedia:      (url) => adminReq("/media", { method:"DELETE", body: JSON.stringify({ url }) }),
  downloadCertificate: (resultId) => {
    const token = localStorage.getItem('armexam_token');
    const url   = `/api/certificate/${resultId}`;
    // Open in new tab — browser will trigger PDF download
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', '');
    a.setAttribute('target', '_blank');
    // Attach token via fetch-blob approach for authenticated download
    return fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => { if (!r.ok) throw new Error('Download failed'); return r.blob(); })
      .then(blob => {
        const burl = URL.createObjectURL(blob);
        a.href = burl;
        a.click();
        setTimeout(() => URL.revokeObjectURL(burl), 5000);
      });
  },
  logout:     ()     => req('/auth/logout',   { method: 'POST' }),
  cancelExamRegistration: (id) => req(`/auth/exam-assignments/${id}`, { method: 'DELETE' }),
  updateProfile:  (data) => req('/auth/profile',  { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => req('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),

  // ── Admin Auth ───────────────────────────────────────────────────────────────
  adminLogin:  (data) => adminReq('/admin/login',  { method: 'POST', body: JSON.stringify(data) }),
  adminMe:     ()     => adminReq('/admin/me'),
  adminLogout: ()     => adminReq('/admin/logout', { method: 'POST' }),

  // ── Admin Management (super_admin only) ──────────────────────────────────────
  getAdmins:    ()           => adminReq('/admins'),
  createAdmin:  (data)       => adminReq('/admins',       { method: 'POST',   body: JSON.stringify(data) }),
  updateAdmin:  (id, data)   => adminReq(`/admins/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  deleteAdmin:  (id)         => adminReq(`/admins/${id}`, { method: 'DELETE' }),

  // ── Examiner Grading ─────────────────────────────────────────────────────────
  getGradingPending: (p = {}) => adminReq('/grading/pending' + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  getGradingGraded:  (p = {}) => adminReq('/grading/graded'  + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  getGradingAuto:    (p = {}) => adminReq('/grading/auto'    + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  getGradingResult:  (id)     => adminReq(`/grading/${id}`),
  submitGrades:      (id, grades) => adminReq(`/grading/${id}`, { method: 'POST', body: JSON.stringify({ grades }) }),
  getGradingStats:   ()       => adminReq('/grading/stats'),

  // ── Cities (public GET, admin write) ─────────────────────────────────────────
  getCities:    ()         => req('/cities'),
  createCity:   (data)     => adminReq('/cities',       { method: 'POST',   body: JSON.stringify(data) }),
  updateCity:   (id, data) => adminReq(`/cities/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  deleteCity:   (id)       => adminReq(`/cities/${id}`, { method: 'DELETE' }),

  // ── Centers ──────────────────────────────────────────────────────────────────
  getCenters:     (cityId) => req(`/cities/${cityId}/centers`), // public endpoint
  getAllCenters:  ()        => adminReq(`/centers`), // admin endpoint - get all centers
  getCenter:      (id)      => adminReq(`/centers/${id}`),
  createCenter:   (data)    => adminReq('/centers',       { method: 'POST',  body: JSON.stringify(data) }),
  updateCenter:   (id, data)=> adminReq(`/centers/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  deleteCenter:   (id)      => adminReq(`/centers/${id}`, { method: 'DELETE' }),
  getCenterExams: (id)      => req(`/centers/${id}/exams`), // public for student registration

  // ── User exam registration (student token) ───────────────────────────────────
  registerForExam: (examId) => req('/user/register-exam', { method: 'POST', body: JSON.stringify({ examId }) }),

  // ── Sections ─────────────────────────────────────────────────────────────────
  getSections:      ()       => adminReq('/sections'),
  reorderSections:  (items)  => adminReq('/sections/reorder', { method:'PATCH', body: JSON.stringify(items) }),
  getQuestionStats: (params={}) => adminReq('/questions/stats?' + new URLSearchParams(params).toString()),
  createSection: (data)       => adminReq('/sections',       { method: 'POST',   body: JSON.stringify(data) }),
  updateSection: (id, data)   => adminReq(`/sections/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  deleteSection: (id)         => adminReq(`/sections/${id}`, { method: 'DELETE' }),

  // ── Questions ────────────────────────────────────────────────────────────────
  getQuestions:   (p = {})   => adminReq('/questions?' + new URLSearchParams(p)),
  createQuestion: (data)     => adminReq('/questions',        { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (id, data) => adminReq(`/questions/${id}`,  { method: 'PUT',  body: JSON.stringify(data) }),
  deleteQuestion: (id)       => adminReq(`/questions/${id}`,  { method: 'DELETE' }),

  // ── Students (admin) ─────────────────────────────────────────────────────────
  getStudents:   (p = {})   => adminReq('/students?' + new URLSearchParams(p)),
  createStudent: (data)     => adminReq('/students',        { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => adminReq(`/students/${id}`,  { method: 'PUT',  body: JSON.stringify(data) }),
  deleteStudent: (id)       => adminReq(`/students/${id}`,  { method: 'DELETE' }),

  // ── Exams (admin) ────────────────────────────────────────────────────────────
  getExams:           (p = {})   => adminReq('/exams?' + new URLSearchParams(p)),
  createExam:         (data)     => adminReq('/exams',           { method: 'POST', body: JSON.stringify(data) }),
  updateExam:         (id, data) => adminReq(`/exams/${id}`,     { method: 'PUT',  body: JSON.stringify(data) }),
  deleteExam:         (id)       => adminReq(`/exams/${id}`,     { method: 'DELETE' }),
  getExamQuestions:   (id, preview = false) => adminReq(`/exams/${id}/questions${preview ? "?preview=true" : ""}`),
  getExamAssignments: (id)       => adminReq(`/exams/${id}/assignments`),

  // ── Results ──────────────────────────────────────────────────────────────────
  getResults:   (p = {}) => adminReq('/results?' + new URLSearchParams(p)),
  createResult: (data)   => req('/results', { method: 'POST', body: JSON.stringify(data) }), // called by student taking exam

  // ── Analytics ────────────────────────────────────────────────────────────────
  getSummary:  ()   => adminReq('/analytics/summary'),
  getByCity:   ()   => adminReq('/analytics/by-city'),
  getByCenter: (id) => adminReq(`/analytics/by-center/${id}`),

  // ── PIN lookup (kiosk — public) ──────────────────────────────────────────────
  getByPin: (pin) => req(`/register/pin/${pin}`),
};
