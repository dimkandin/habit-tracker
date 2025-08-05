import React from 'react';

// Формула силы привычки как в Loop Habit Tracker
const calculateHabitStrength = (habit) => {
  const today = new Date();
  const startDate = new Date(habit.createdAt);
  const daysSinceCreation = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceCreation === 0) return 0;
  
  let strength = 0;
  let streakLength = 0;
  
  // Проходим по всем дням с момента создания
  for (let i = 0; i <= daysSinceCreation; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    
    const isCompleted = habit.completed && habit.completed[dateKey];
    
    if (isCompleted) {
      streakLength++;
      // Каждое выполнение добавляет силу, но с убывающей отдачей
      strength += Math.min(1.0, (streakLength * 0.05));
    } else {
      streakLength = 0;
      // Пропуск ослабляет привычку, но не обнуляет полностью
      strength = Math.max(0, strength * 0.95);
    }
  }
  
  // Нормализуем к 100%
  return Math.min(100, Math.max(0, strength * 20));
};

// Получить цвет в зависимости от силы
const getStrengthColor = (strength) => {
  if (strength >= 80) return '#2dce89'; // Зеленый - очень сильная
  if (strength >= 60) return '#5e72e4'; // Синий - сильная
  if (strength >= 40) return '#fb8c00'; // Оранжевый - средняя
  if (strength >= 20) return '#f5365c'; // Красный - слабая
  return '#6c757d'; // Серый - очень слабая
};

// Получить описание силы
const getStrengthLabel = (strength) => {
  if (strength >= 80) return 'Очень сильная';
  if (strength >= 60) return 'Сильная';
  if (strength >= 40) return 'Средняя';
  if (strength >= 20) return 'Слабая';
  return 'Очень слабая';
};

const HabitStrength = ({ habit, showLabel = true, size = 'normal' }) => {
  const strength = calculateHabitStrength(habit);
  const color = getStrengthColor(strength);
  const label = getStrengthLabel(strength);
  
  const isSmall = size === 'small';
  const barHeight = isSmall ? '4px' : '6px';
  const fontSize = isSmall ? '12px' : '14px';
  
  return (
    <div className={`habit-strength ${isSmall ? 'small' : ''}`}>
      <div className="strength-bar-container">
        <div 
          className="strength-bar-bg"
          style={{
            width: '100%',
            height: barHeight,
            backgroundColor: '#e9ecef',
            borderRadius: '3px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="strength-bar-fill"
            style={{
              width: `${strength}%`,
              height: '100%',
              backgroundColor: color,
              borderRadius: '3px',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      </div>
      
      {showLabel && (
        <div 
          className="strength-info"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '4px',
            fontSize: fontSize,
            color: '#6c757d'
          }}
        >
          <span className="strength-label">{label}</span>
          <span className="strength-value" style={{ color: color, fontWeight: '500' }}>
            {Math.round(strength)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default HabitStrength;
export { calculateHabitStrength, getStrengthColor, getStrengthLabel };