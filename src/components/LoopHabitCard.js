import React from 'react';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Check, X, Plus, Minus, Smile } from 'lucide-react';
import HabitStrength from './HabitStrength';

const LoopHabitCard = ({ 
  habit, 
  onToggleHabit, 
  onSetValue, 
  onSetMood, 
  onRemove,
  currentWeek 
}) => {
  // Генерируем дни недели для отображения
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  
  const getHabitValue = (habit, day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    
    if (habit.category === 'binary') {
      return habit.completed && habit.completed[dateKey];
    } else if (habit.category === 'quantity') {
      return habit.values && habit.values[dateKey];
    } else if (habit.category === 'mood') {
      return habit.mood && habit.mood[dateKey];
    }
    return null;
  };

  const getCurrentStreak = (habit) => {
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);
    
    while (true) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      if (habit.completed && habit.completed[dateKey]) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const renderDayCell = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const isToday = isSameDay(day, new Date());
    const habitValue = getHabitValue(habit, day);
    const dayName = format(day, 'EEE', { locale: ru });
    const dayNumber = format(day, 'd');
    
    let cellClass = 'loop-day-cell';
    if (isToday) cellClass += ' today';
    if (habitValue) cellClass += ' completed';
    
    const getCellColor = () => {
      if (!habitValue) return 'transparent';
      
      if (habit.category === 'binary') {
        return habit.color || '#5e72e4';
      } else if (habit.category === 'quantity') {
        const progress = Math.min(habitValue / (habit.target || 1), 1);
        const opacity = 0.3 + (progress * 0.7);
        return `${habit.color || '#5e72e4'}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
      } else if (habit.category === 'mood') {
        const moodColors = {
          1: '#f5365c',
          2: '#fb8c00', 
          3: '#ffc107',
          4: '#2dce89',
          5: '#11cdef'
        };
        return moodColors[habitValue] || '#6c757d';
      }
      
      return habit.color || '#5e72e4';
    };

    return (
      <div key={dateKey} className={cellClass}>
        <div className="day-header">
          <div className="day-name">{dayName}</div>
          <div className="day-number">{dayNumber}</div>
        </div>
        
        <div 
          className="day-indicator"
          style={{ backgroundColor: getCellColor() }}
          onClick={() => {
            if (habit.category === 'binary') {
              onToggleHabit(habit.id, dateKey, !habitValue);
            } else if (habit.category === 'quantity') {
              const newValue = window.prompt(
                `Введите значение для ${habit.name} (${habit.unit || 'единиц'})`,
                habitValue || ''
              );
              if (newValue !== null) {
                onSetValue(habit.id, dateKey, parseFloat(newValue) || 0);
              }
            } else if (habit.category === 'mood') {
              const newMood = window.prompt(
                'Выберите настроение (1-5):\n1 - Очень плохо\n2 - Плохо\n3 - Нормально\n4 - Хорошо\n5 - Отлично',
                habitValue || ''
              );
              if (newMood !== null) {
                const mood = parseInt(newMood);
                if (mood >= 1 && mood <= 5) {
                  onSetMood(habit.id, dateKey, mood);
                }
              }
            }
          }}
        >
          {habit.category === 'binary' && habitValue && (
            <Check size={12} color="white" />
          )}
          {habit.category === 'quantity' && habitValue && (
            <span className="quantity-value">{habitValue}</span>
          )}
          {habit.category === 'mood' && habitValue && (
            <span className="mood-emoji">
              {habitValue === 1 ? '😢' : 
               habitValue === 2 ? '😕' : 
               habitValue === 3 ? '😐' : 
               habitValue === 4 ? '🙂' : '😊'}
            </span>
          )}
        </div>
      </div>
    );
  };

  const streak = getCurrentStreak(habit);

  return (
    <div className="loop-habit-card" style={{ borderLeft: `4px solid ${habit.color}` }}>
      <div className="habit-header">
        <div className="habit-info">
          <h3 className="habit-name">{habit.name}</h3>
          <div className="habit-meta">
            <span className="habit-category">{
              habit.category === 'binary' ? 'Да/Нет' :
              habit.category === 'quantity' ? `${habit.target} ${habit.unit || 'ед.'}` :
              'Настроение'
            }</span>
            {streak > 0 && (
              <span className="current-streak">🔥 {streak}</span>
            )}
          </div>
        </div>
        
        <button 
          className="remove-habit-btn"
          onClick={() => onRemove(habit.id)}
          title="Удалить привычку"
        >
          <X size={16} />
        </button>
      </div>

      <div className="habit-strength-section">
        <HabitStrength habit={habit} size="small" />
      </div>

      <div className="habit-week-grid">
        {weekDays.map(renderDayCell)}
      </div>
    </div>
  );
};

export default LoopHabitCard;