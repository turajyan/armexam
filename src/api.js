const BASE = '/api';

async function req(url, opts = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Questions
  getQuestions:   (p = {}) => req('/questions?' + new URLSearchParams(p)),
  createQuestion: (data)   => req('/questions', { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (id, data) => req(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestion: (id)     => req(`/questions/${id}`, { method: 'DELETE' }),

  // Students
  getStudents:   (p = {}) => req('/students?' + new URLSearchParams(p)),
  createStudent: (data)   => req('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => req(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id)     => req(`/students/${id}`, { method: 'DELETE' }),

  // Exams
  getExams:          (p = {}) => req('/exams?' + new URLSearchParams(p)),
  createExam:        (data)   => req('/exams', { method: 'POST', body: JSON.stringify(data) }),
  updateExam:        (id, data) => req(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExam:        (id)     => req(`/exams/${id}`, { method: 'DELETE' }),
  getExamQuestions:  (id)     => req(`/exams/${id}/questions`),

  // Results
  getResults:   (p = {}) => req('/results?' + new URLSearchParams(p)),
  createResult: (data)   => req('/results', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getSummary: () => req('/analytics/summary'),
};
