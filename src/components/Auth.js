import React, { useState } from 'react';
import { User, Lock, Mail, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

const Auth = ({ onAuthSuccess, onSkip }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { api } = await import('../config/api');
      
      let result;
      if (isLogin) {
        result = await api.login(formData.email, formData.password);
      } else {
        result = await api.register(formData.email, formData.password, formData.name);
      }

      // Сохраняем токен и данные пользователя
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('userData', JSON.stringify(result.user));
      
      onAuthSuccess(result);
    } catch (error) {
      setError(error.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon">
            {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
          <h2>{isLogin ? 'Добро пожаловать!' : 'Создайте аккаунт'}</h2>
          <p>
            {isLogin 
              ? 'Войдите для синхронизации ваших привычек между устройствами'
              : 'Зарегистрируйтесь и получите доступ к своим привычкам с любого устройства'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="input-group">
              <User className="input-icon" size={20} />
              <input
                type="text"
                name="name"
                placeholder="Ваше имя"
                value={formData.name}
                onChange={handleInputChange}
                required={!isLogin}
              />
            </div>
          )}

          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="link-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin 
              ? 'Нет аккаунта? Зарегистрируйтесь'
              : 'Уже есть аккаунт? Войдите'
            }
          </button>

          <button
            type="button"
            className="link-button skip-button"
            onClick={onSkip}
          >
            Пропустить и работать офлайн
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;