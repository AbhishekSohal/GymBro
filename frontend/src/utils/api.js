const API_BASE = '/api';

/**
 * Custom fetch wrapper that includes credentials (cookies) for JWT auth
 */
async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Crucial for reading/writing httpOnly JWT cookies
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${url}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Auth
  register: (email, password, name) => 
    request('/auth/register', { method: 'POST', body: { email, password, name } }),
    
  login: (email, password) => 
    request('/auth/login', { method: 'POST', body: { email, password } }),
    
  logout: () => 
    request('/auth/logout', { method: 'POST' }),
    
  checkSession: () => 
    request('/auth/session', { method: 'GET' }),

  // Workout Templates
  getWorkoutDays: () => 
    request('/workout-days', { method: 'GET' }),
    
  createWorkoutDay: (name) => 
    request('/workout-days', { method: 'POST', body: { name } }),
    
  addExerciseToDay: (dayId, name, muscleGroup) => 
    request(`/workout-days/${dayId}/exercises`, { method: 'POST', body: { name, muscleGroup } }),

  // Active Sessions
  startSession: (workoutDayId) => 
    request('/sessions', { method: 'POST', body: { workoutDayId } }),
    
  getSession: (id) => 
    request(`/sessions/${id}`, { method: 'GET' }),
    
  getLastValues: (sessionId) => 
    request(`/sessions/${sessionId}/last-values`, { method: 'GET' }),
    
  saveSet: (sessionId, exerciseId, setNumber, weight, reps, completed) => 
    request(`/sessions/${sessionId}/sets/${exerciseId}`, { 
      method: 'PATCH', 
      body: { setNumber, weight, reps, completed } 
    }),
    
  finishSession: (sessionId, notes) => 
    request(`/sessions/${sessionId}/finish`, { method: 'POST', body: { notes } }),

  // Analytics & History
  getPastSessions: () => 
    request('/sessions/past', { method: 'GET' }),
    
  getExerciseHistory: (exerciseId) => 
    request(`/exercises/${exerciseId}/history`, { method: 'GET' }),
    
  getExercisesList: () => 
    request('/exercises', { method: 'GET' }),
};
