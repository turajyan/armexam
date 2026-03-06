const BASE = '/api';

function getToken() {
  try { return localStorage.getItem('armexam_token') || ''; } catch { return ''; }
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

export const api = {
  // Auth
  register: (data) => req('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login:    (data) => req('/auth/login',    { method: 'POST', body: JSON.stringify(data) }),
  me:       ()     => req('/auth/me'),
  logout:   ()     => req('/auth/logout',   { method: 'POST' }),

  // Cities (admin CRUD)
  getCities:    ()         => req('/cities'),
  createCity:   (data)     => req('/cities',     { method: 'POST',   body: JSON.stringify(data) }),
  updateCity:   (id, data) => req(`/cities/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  deleteCity:   (id)       => req(`/cities/${id}`, { method: 'DELETE' }),

  // Centers (admin CRUD)
  getCenters:   (p = {})   => req('/centers' + (Object.keys(p).length ? '?' + new URLSearchParams(p) : '')),
  getCenter:    (id)        => req(`/centers/${id}`),
  createCenter: (data)      => req('/centers',      { method: 'POST',  body: JSON.stringify(data) }),
  updateCenter: (id, data)  => req(`/centers/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  deleteCenter: (id)        => req(`/centers/${id}`, { method: 'DELETE' }),
  getCenterExams: (id)      => req(`/centers/${id}/exams`),

  // User exam registration (authenticated)
  registerForExam: (examId) => req('/user/register-exam', { method: 'POST', body: JSON.stringify({ examId }) }),

  // Questions
  getQuestions:   (p = {}) => req('/questions?' + new URLSearchParams(p)),
  createQuestion: (data)   => req('/questions', { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (id, data) => req(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestion: (id)     => req(`/questions/${id}`, { method: 'DELETE' }),

  // Students (admin)
  getStudents:   (p = {}) => req('/students?' + new URLSearchParams(p)),
  createStudent: (data)   => req('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => req(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id)     => req(`/students/${id}`, { method: 'DELETE' }),

  // Exams (admin)
  getExams:          (p = {}) => req('/exams?' + new URLSearchParams(p)),
  createExam:        (data)   => req('/exams', { method: 'POST', body: JSON.stringify(data) }),
  updateExam:        (id, data) => req(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExam:        (id)     => req(`/exams/${id}`, { method: 'DELETE' }),
  getExamQuestions:  (id)     => req(`/exams/${id}/questions`),

  // Results
  getResults:   (p = {}) => req('/results?' + new URLSearchParams(p)),
  createResult: (data)   => req('/results', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getSummary:      ()   => req('/analytics/summary'),
  getByCity:       ()   => req('/analytics/by-city'),
  getByCenter:     (id) => req(`/analytics/by-center/${id}`),

  // PIN lookup (kiosk)
  getByPin: (pin) => req(`/register/pin/${pin}`),
};
