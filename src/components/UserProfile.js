import React, { useState } from 'react';
import { User, LogOut, Settings, Mail, Calendar, BarChart3, Trophy, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const UserProfile = ({ user, onLogout, onClose, habits = [] }) => {
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  // Статистика пользователя
  const getUserStats = () => {
    const totalHabits = habits.length;
    const activeHabits = habits.filter(habit => {
      const today = format(new Date(), 'yyyy-MM-dd');
      return habit.completed && habit.completed[today];
    }).length;
    
    const totalCompletions = habits.reduce((sum, habit) => {
      return sum + (habit.totalCompletions || 0);
    }, 0);
    
    const avgStreak = habits.length > 0 
      ? Math.round(habits.reduce((sum, habit) => sum + (habit.streak || 0), 0) / habits.length)
      : 0;
    
    const registrationDate = user.createdAt ? new Date(user.createdAt) : new Date();
    const daysRegistered = Math.floor((new Date() - registrationDate) / (1000 * 60 * 60 * 24));
    
    return {
      totalHabits,
      activeHabits,
      totalCompletions,
      avgStreak,
      daysRegistered
    };
  };

  const stats = getUserStats();

  const handleLogout = () => {
    setShowConfirmLogout(false);
    onLogout();
  };

  return (
    <div className="profile-overlay">
      <div className="profile-container">
        <div className="profile-header">
          <button className="profile-close" onClick={onClose}>
            <X size={20} />
          </button>
          <div className="profile-avatar">
            <User size={32} />
          </div>
          <h2>{user.name || 'Пользователь'}</h2>
          <p className="profile-email">{user.email}</p>
          <div className="profile-since">
            Зарегистрирован {format(new Date(user.createdAt || new Date()), 'd MMMM yyyy', { locale: ru })}
          </div>
        </div>

        <div className="profile-stats">
          <h3>📊 Ваша статистика</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">📝</div>
              <div className="stat-info">
                <div className="stat-number">{stats.totalHabits}</div>
                <div className="stat-label">Привычки</div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <div className="stat-number">{stats.activeHabits}</div>
                <div className="stat-label">Сегодня</div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <div className="stat-number">{stats.totalCompletions}</div>
                <div className="stat-label">Всего выполнений</div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">🔥</div>
              <div className="stat-info">
                <div className="stat-number">{stats.avgStreak}</div>
                <div className="stat-label">Средняя серия</div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <div className="stat-number">{stats.daysRegistered}</div>
                <div className="stat-label">Дней с нами</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button 
            className="profile-logout-btn"
            onClick={() => setShowConfirmLogout(true)}
          >
            <LogOut size={18} />
            Выйти из аккаунта
          </button>
        </div>

        {showConfirmLogout && (
          <div className="logout-confirm">
            <div className="logout-confirm-content">
              <h4>Подтвердите выход</h4>
              <p>Вы уверены, что хотите выйти? Все несинхронизированные данные могут быть потеряны.</p>
              <div className="logout-confirm-actions">
                <button 
                  className="logout-cancel-btn"
                  onClick={() => setShowConfirmLogout(false)}
                >
                  Отмена
                </button>
                <button 
                  className="logout-confirm-btn"
                  onClick={handleLogout}
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;