import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, X, Check, Minus, Target, BarChart3, Settings, Download, Upload, Bell, Calendar, TrendingUp } from 'lucide-react';
import './App.css';

function App() {
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : [];
  });
  const [newHabit, setNewHabit] = useState('');
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [habitType, setHabitType] = useState('daily');
  const [habitColor, setHabitColor] = useState('#667eea');
  const [habitTarget, setHabitTarget] = useState(1);
  const [reminderTime, setReminderTime] = useState('09:00');

  // Сохранение привычек в localStorage
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  // Генерация дней недели
  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(currentWeek, i)
  );

  // Генерация дней месяца
  const monthDays = eachDayOfInterval({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  // Добавление новой привычки
  const addHabit = () => {
    if (newHabit.trim()) {
      const habit = {
        id: Date.now(),
        name: newHabit.trim(),
        type: habitType,
        color: habitColor,
        target: habitTarget,
        reminderTime: reminderTime,
        completed: {},
        createdAt: new Date().toISOString(),
        streak: 0,
        bestStreak: 0,
        totalCompletions: 0
      };
      setHabits([...habits, habit]);
      setNewHabit('');
      setHabitType('daily');
      setHabitColor('#667eea');
      setHabitTarget(1);
      setReminderTime('09:00');
      setShowAddModal(false);
    }
  };

  // Удаление привычки
  const removeHabit = (habitId) => {
    setHabits(habits.filter(habit => habit.id !== habitId));
  };

  // Отметка выполнения привычки
  const toggleHabitCompletion = (habitId, date) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const dateKey = format(date, 'yyyy-MM-dd');
        const newCompleted = { ...habit.completed };
        
        if (newCompleted[dateKey]) {
          delete newCompleted[dateKey];
        } else {
          newCompleted[dateKey] = true;
        }
        
        // Обновляем статистику
        const totalCompletions = Object.keys(newCompleted).length;
        const streak = calculateStreak(newCompleted);
        const bestStreak = Math.max(habit.bestStreak, streak);
        
        return { 
          ...habit, 
          completed: newCompleted,
          totalCompletions,
          streak,
          bestStreak
        };
      }
      return habit;
    }));
  };

  // Расчет серии выполнения
  const calculateStreak = (completed) => {
    const sortedDates = Object.keys(completed)
      .filter(date => completed[date])
      .sort()
      .reverse();
    
    if (sortedDates.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (isSameDay(date, expectedDate)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Получение статистики привычки
  const getHabitStats = (habit) => {
    const totalDays = differenceInDays(new Date(), new Date(habit.createdAt)) + 1;
    const completionRate = totalDays > 0 ? Math.round((habit.totalCompletions / totalDays) * 100) : 0;
    
    return {
      totalDays,
      completionRate,
      streak: habit.streak,
      bestStreak: habit.bestStreak,
      totalCompletions: habit.totalCompletions
    };
  };

  // Экспорт данных
  const exportData = () => {
    const data = {
      habits,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habits-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Импорт данных
  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.habits) {
            setHabits(data.habits);
          }
        } catch (error) {
          alert('Ошибка при импорте файла');
        }
      };
      reader.readAsText(file);
    }
  };

  // Переход к предыдущей неделе
  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  // Переход к следующей неделе
  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  // Переход к текущей неделе
  const goToCurrentWeek = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Цвета для привычек
  const habitColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#fa709a', '#fee140', '#a8edea', '#fed6e3'
  ];

  return (
    <div className="app">
      <header className="header">
        <h1>Трекер привычек</h1>
        <p>Отслеживайте свои ежедневные привычки</p>
        <div className="header-actions">
          <button onClick={() => setShowStats(!showStats)} className="header-button">
            <BarChart3 size={20} />
            Статистика
          </button>
          <button onClick={exportData} className="header-button">
            <Download size={20} />
            Экспорт
          </button>
          <label className="header-button">
            <Upload size={20} />
            Импорт
            <input
              type="file"
              accept=".json"
              onChange={importData}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </header>

      <main className="main">
        {/* Форма добавления привычки */}
        <div className="add-habit-section">
          <button 
            onClick={() => setShowAddModal(true)}
            className="add-habit-button"
          >
            <Plus size={20} />
            Добавить привычку
          </button>
        </div>

        {/* Модальное окно добавления привычки */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Новая привычка</h2>
              <div className="modal-form">
                <div className="form-group">
                  <label>Название привычки</label>
                  <input
                    type="text"
                    value={newHabit}
                    onChange={(e) => setNewHabit(e.target.value)}
                    placeholder="Введите название привычки..."
                    className="habit-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Тип привычки</label>
                  <select 
                    value={habitType} 
                    onChange={(e) => setHabitType(e.target.value)}
                    className="habit-select"
                  >
                    <option value="daily">Ежедневная</option>
                    <option value="weekly">Еженедельная</option>
                    <option value="monthly">Ежемесячная</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Цвет</label>
                  <div className="color-picker">
                    {habitColors.map(color => (
                      <button
                        key={color}
                        className={`color-option ${habitColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setHabitColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Цель (раз в {habitType === 'daily' ? 'день' : habitType === 'weekly' ? 'неделю' : 'месяц'})</label>
                  <input
                    type="number"
                    min="1"
                    value={habitTarget}
                    onChange={(e) => setHabitTarget(parseInt(e.target.value))}
                    className="habit-input"
                  />
                </div>

                <div className="form-group">
                  <label>Напоминание</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="habit-input"
                  />
                </div>

                <div className="modal-actions">
                  <button onClick={() => setShowAddModal(false)} className="cancel-button">
                    Отмена
                  </button>
                  <button onClick={addHabit} className="add-button">
                    Добавить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Навигация по неделям */}
        <div className="week-navigation">
          <button onClick={goToPreviousWeek} className="nav-button">
            ← Предыдущая
          </button>
          <div className="current-week">
            <span>
              {format(currentWeek, 'd MMMM yyyy', { locale: ru })} - {format(addDays(currentWeek, 6), 'd MMMM yyyy', { locale: ru })}
            </span>
            <button onClick={goToCurrentWeek} className="current-week-button">
              Сегодня
            </button>
          </div>
          <button onClick={goToNextWeek} className="nav-button">
            Следующая →
          </button>
        </div>

        {/* Статистика */}
        {showStats && (
          <div className="stats-section">
            <h3>Общая статистика</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{habits.length}</div>
                <div className="stat-label">Всего привычек</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {habits.reduce((sum, habit) => sum + habit.totalCompletions, 0)}
                </div>
                <div className="stat-label">Всего выполнений</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {habits.reduce((sum, habit) => sum + habit.streak, 0)}
                </div>
                <div className="stat-label">Текущая серия</div>
              </div>
            </div>
          </div>
        )}

        {/* Список привычек */}
        <div className="habits-container">
          {habits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>Нет привычек</h3>
              <p>Добавьте свою первую привычку, чтобы начать отслеживание</p>
            </div>
          ) : (
            <div className="habits-grid">
              {habits.map(habit => {
                const stats = getHabitStats(habit);
                return (
                  <div key={habit.id} className="habit-card" style={{ borderLeft: `4px solid ${habit.color}` }}>
                    <div className="habit-header">
                      <div className="habit-info">
                        <h3 className="habit-name">{habit.name}</h3>
                        <div className="habit-meta">
                          <span className="habit-type">{habit.type === 'daily' ? 'Ежедневная' : habit.type === 'weekly' ? 'Еженедельная' : 'Ежемесячная'}</span>
                          <span className="habit-target">Цель: {habit.target}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeHabit(habit.id)}
                        className="remove-button"
                        title="Удалить привычку"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="habit-stats-mini">
                      <div className="stat-item">
                        <TrendingUp size={16} />
                        <span>{stats.streak} дн.</span>
                      </div>
                      <div className="stat-item">
                        <Target size={16} />
                        <span>{stats.completionRate}%</span>
                      </div>
                      <div className="stat-item">
                        <Check size={16} />
                        <span>{stats.totalCompletions}</span>
                      </div>
                    </div>
                    
                    <div className="habit-days">
                      {weekDays.map(day => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const isCompleted = habit.completed[dateKey];
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                          <div 
                            key={day.toISOString()} 
                            className={`day-cell ${isToday ? 'today' : ''} ${isCompleted ? 'completed' : ''}`}
                          >
                            <div className="day-header">
                              <span className="day-name">
                                {format(day, 'EEE', { locale: ru })}
                              </span>
                              <span className="day-date">
                                {format(day, 'd')}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleHabitCompletion(habit.id, day)}
                              className={`completion-button ${isCompleted ? 'completed' : ''}`}
                              style={{ borderColor: habit.color }}
                              title={isCompleted ? 'Отменить выполнение' : 'Отметить как выполненное'}
                            >
                              {isCompleted ? <Check size={16} /> : <Minus size={16} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App; 