// API Configuration
const API_CONFIG = {
  // Локальный development сервер
  development: {
    baseURL: 'http://localhost:5000/api',
    enabled: true // включен для тестирования
  },
  // Production Railway API
  production: {
    baseURL: 'https://habit-tracker-backend-production-d3e2.up.railway.app/api',
    enabled: true
  }
};

// Определяем текущую среду
const getCurrentEnvironment = () => {
  // Если запущено на GitHub Pages
  if (window.location.hostname === 'dimkandin.github.io') {
    return 'production';
  }
  // Если локальная разработка
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'development';
  }
  // По умолчанию production
  return 'production';
};

const currentEnv = getCurrentEnvironment();
const config = API_CONFIG[currentEnv];

console.log(`🔗 API Config: ${currentEnv}`, config);

// API функции
export const api = {
  baseURL: config.baseURL,
  enabled: config.enabled,
  
  // Проверка здоровья API
  async health() {
    if (!this.enabled) return { status: 'disabled' };
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await response.json();
    } catch (error) {
      console.error('API health check failed:', error);
      return { status: 'error', error: error.message };
    }
  },

  // Аутентификация
  async register(email, password, name) {
    if (!this.enabled) throw new Error('API отключен');
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Сервер недоступен или вернул неверный формат данных');
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка регистрации');
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        throw new Error('Не удается подключиться к серверу');
      }
      throw error;
    }
  },

  async login(email, password) {
    if (!this.enabled) throw new Error('API отключен');
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Сервер недоступен или вернул неверный формат данных');
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        throw new Error('Не удается подключиться к серверу');
      }
      throw error;
    }
  },

  // Привычки
  async getHabits(token) {
    if (!this.enabled) return [];
    const response = await fetch(`${this.baseURL}/habits`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Ошибка получения привычек');
    return await response.json();
  },

  async createHabit(habit, token) {
    if (!this.enabled) throw new Error('API отключен');
    const response = await fetch(`${this.baseURL}/habits`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(habit)
    });
    if (!response.ok) throw new Error('Ошибка создания привычки');
    return await response.json();
  },

  async updateHabit(id, habit, token) {
    if (!this.enabled) throw new Error('API отключен');
    const response = await fetch(`${this.baseURL}/habits/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(habit)
    });
    if (!response.ok) throw new Error('Ошибка обновления привычки');
    return await response.json();
  },

  async deleteHabit(id, token) {
    if (!this.enabled) throw new Error('API отключен');
    const response = await fetch(`${this.baseURL}/habits/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Ошибка удаления привычки');
    return await response.json();
  },

  // Трекинг привычек
  async toggleCompletion(habitId, date, completed, token) {
    if (!this.enabled) throw new Error('API отключен');
    const response = await fetch(`${this.baseURL}/habits/${habitId}/completion`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ date, completed })
    });
    if (!response.ok) throw new Error('Ошибка обновления выполнения');
    return await response.json();
  },

  async setValue(habitId, date, value, token) {
    if (!this.enabled) throw new Error('API отключен');
    const response = await fetch(`${this.baseURL}/habits/${habitId}/value`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ date, value })
    });
    if (!response.ok) throw new Error('Ошибка установки значения');
    return await response.json();
  },

  async setMood(habitId, date, moodValue, token) {
    if (!this.enabled) throw new Error('API отключен');
    const response = await fetch(`${this.baseURL}/habits/${habitId}/mood`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ date, mood_value: moodValue })
    });
    if (!response.ok) throw new Error('Ошибка установки настроения');
    return await response.json();
  }
};

export default api;