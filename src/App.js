import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, X, Check, Minus, Target, BarChart3, Settings, Download, Upload, Bell, Calendar, TrendingUp, Moon, Sun, Smile, Activity, Zap, FileText, Database } from 'lucide-react';
import './App.css';

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Сначала удаляем старые Service Workers
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for(let registration of registrations) {
        registration.unregister();
      }
    }).then(() => {
      // Регистрируем новый Service Worker
      return navigator.serviceWorker.register('/habit-tracker/sw.js');
    }).then((registration) => {
      console.log('SW registered successfully: ', registration);
      // Принудительно обновляем Service Worker
      registration.update();
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

function App() {
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : [];
  });
  const [newHabit, setNewHabit] = useState('');
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [habitType, setHabitType] = useState('daily');
  const [habitCategory, setHabitCategory] = useState('binary');
  const [habitColor, setHabitColor] = useState('#667eea');
  const [habitTarget, setHabitTarget] = useState(1);
  const [habitUnit, setHabitUnit] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [darkMode, setDarkMode] = useState(false);
  const [compactView, setCompactView] = useState(true);
  const [importSource, setImportSource] = useState('custom');
  const [importData, setImportData] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [dataLoadStatus, setDataLoadStatus] = useState('');
  const [compactMode, setCompactMode] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Запрос разрешений на уведомления
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Обработка события установки PWA
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });

    // Проверяем, установлено ли уже приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA: App is already installed');
    }

    // Проверяем регистрацию Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('PWA: Service Worker registrations:', registrations);
      });
    }
  }, []);

  // Функция установки PWA
  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  // Автоматическая загрузка данных из файлов
  const loadDefaultData = async () => {
    try {
      // Проверяем, загружены ли уже данные
      const dataLoaded = localStorage.getItem('defaultDataLoaded');
      if (dataLoaded === 'true') {
        setDataLoadStatus('Данные уже загружены');
        return;
      }

      setDataLoadStatus('Загрузка данных...');

      // Загружаем данные из файлов
      const daylioResponse = await fetch('/data/daylio_export_2025_08_03.csv');
      const habitTrackerResponse = await fetch('/data/20230208_20250803_Habit.csv');
      const wayOfLifeResponse = await fetch('/data/Way of Life (03.08.2025).csv');

      if (daylioResponse.ok && habitTrackerResponse.ok && wayOfLifeResponse.ok) {
        const daylioData = await daylioResponse.text();
        const habitTrackerData = await habitTrackerResponse.text();
        const wayOfLifeData = await wayOfLifeResponse.text();

        // Импортируем данные
        const daylioSuccess = importFromDaylio(daylioData);
        const habitTrackerSuccess = importFromHabitTracker(habitTrackerData);
        const wayOfLifeSuccess = importFromWayOfLife(wayOfLifeData);

        if (daylioSuccess && habitTrackerSuccess && wayOfLifeSuccess) {
          localStorage.setItem('defaultDataLoaded', 'true');
          setDataLoadStatus('✅ Данные успешно загружены');
          console.log('✅ Данные успешно загружены');
        } else {
          setDataLoadStatus('Ошибка при импорте данных');
        }
      } else {
        setDataLoadStatus('Файлы данных не найдены');
      }
    } catch (error) {
      setDataLoadStatus('Данные не найдены, можно импортировать вручную');
      console.log('Данные не найдены, можно импортировать вручную');
    }
  };

  // Получение информации о хранении
  const getStorageInfo = () => {
    const habitsSize = new Blob([JSON.stringify(habits)]).size;
    const totalSize = habitsSize + (localStorage.getItem('darkMode')?.length || 0);
    
    return {
      habitsCount: habits.length,
      totalSize: (totalSize / 1024).toFixed(2), // в КБ
      storageUsed: (totalSize / (5 * 1024 * 1024) * 100).toFixed(2), // процент от 5МБ
      lastSync: localStorage.getItem('lastSync') || 'Никогда'
    };
  };

  // Синхронизация данных
  const syncData = () => {
    const now = new Date().toISOString();
    localStorage.setItem('lastSync', now);
    localStorage.setItem('habits', JSON.stringify(habits));
    setDataLoadStatus('✅ Данные синхронизированы');
  };

  // Очистка данных
  const clearData = () => {
    if (window.confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
      localStorage.clear();
      setHabits([]);
      setDataLoadStatus('Данные очищены');
    }
  };

  // Загружаем данные при первом запуске
  useEffect(() => {
    loadDefaultData();
  }, []);

  // Сохранение привычек в localStorage
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  // Сохранение настроек темы
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

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
        category: habitCategory,
        color: habitColor,
        target: habitTarget,
        unit: habitUnit,
        reminderTime: reminderTime,
        completed: {},
        values: {}, // Для количественных привычек
        mood: {}, // Для привычек настроения
        createdAt: new Date().toISOString(),
        streak: 0,
        bestStreak: 0,
        totalCompletions: 0
      };
      setHabits([...habits, habit]);
      setNewHabit('');
      setHabitType('daily');
      setHabitCategory('binary');
      setHabitColor('#667eea');
      setHabitTarget(1);
      setHabitUnit('');
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

  // Обновление количественного значения
  const updateQuantityValue = (habitId, date, value) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const dateKey = format(date, 'yyyy-MM-dd');
        const newValues = { ...habit.values };
        
        if (value === '' || value === 0) {
          delete newValues[dateKey];
        } else {
          newValues[dateKey] = parseFloat(value);
        }
        
        // Обновляем статистику
        const totalCompletions = Object.keys(newValues).length;
        const streak = calculateStreak(newValues);
        const bestStreak = Math.max(habit.bestStreak, streak);
        
        return { 
          ...habit, 
          values: newValues,
          totalCompletions,
          streak,
          bestStreak
        };
      }
      return habit;
    }));
  };

  // Обновление настроения
  const updateMoodValue = (habitId, date, moodValue) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const dateKey = format(date, 'yyyy-MM-dd');
        const newMood = { ...habit.mood };
        
        if (moodValue === null) {
          delete newMood[dateKey];
        } else {
          newMood[dateKey] = moodValue;
        }
        
        // Обновляем статистику
        const totalCompletions = Object.keys(newMood).length;
        const streak = calculateStreak(newMood);
        const bestStreak = Math.max(habit.bestStreak, streak);
        
        return { 
          ...habit, 
          mood: newMood,
          totalCompletions,
          streak,
          bestStreak
        };
      }
      return habit;
    }));
  };

  // Расчет серии выполнения
  const calculateStreak = (data) => {
    const sortedDates = Object.keys(data)
      .filter(date => data[date])
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
    let completionRate = 0;
    
    if (habit.category === 'binary') {
      completionRate = totalDays > 0 ? Math.round((habit.totalCompletions / totalDays) * 100) : 0;
    } else if (habit.category === 'quantity') {
      const totalValue = Object.values(habit.values || {}).reduce((sum, val) => sum + val, 0);
      const targetValue = habit.target * totalDays;
      completionRate = targetValue > 0 ? Math.round((totalValue / targetValue) * 100) : 0;
    } else if (habit.category === 'mood') {
      const moodValues = Object.values(habit.mood || {});
      const avgMood = moodValues.length > 0 ? moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length : 0;
      completionRate = Math.round(avgMood * 20); // Преобразуем 1-5 в проценты
    }
    
    return {
      totalDays,
      completionRate,
      streak: habit.streak,
      bestStreak: habit.bestStreak,
      totalCompletions: habit.totalCompletions
    };
  };

  // Получение значения привычки для конкретного дня
  const getHabitValue = (habit, date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (habit.category === 'binary') {
      return habit.completed[dateKey] || false;
    } else if (habit.category === 'quantity') {
      return habit.values[dateKey] || 0;
    } else if (habit.category === 'mood') {
      return habit.mood[dateKey] || null;
    }
    
    return false;
  };

  // Получение иконки для категории
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'binary':
        return <Check size={14} />;
      case 'quantity':
        return <Activity size={14} />;
      case 'mood':
        return <Smile size={14} />;
      default:
        return <Zap size={14} />;
    }
  };

  // Получение названия категории
  const getCategoryName = (category) => {
    switch (category) {
      case 'binary':
        return 'Бинарная';
      case 'quantity':
        return 'Количественная';
      case 'mood':
        return 'Настроение';
      default:
        return 'Другая';
    }
  };

  // Импорт из uHabits
  const importFromUHabits = (data) => {
    try {
      const uhabitsData = JSON.parse(data);
      const importedHabits = [];
      
      if (uhabitsData.habits) {
        uhabitsData.habits.forEach(uhabit => {
          const habit = {
            id: Date.now() + Math.random(),
            name: uhabit.name || 'Импортированная привычка',
            type: 'daily',
            category: 'binary',
            color: habitColors[Math.floor(Math.random() * habitColors.length)],
            target: 1,
            unit: '',
            reminderTime: '09:00',
            completed: {},
            values: {},
            mood: {},
            createdAt: new Date().toISOString(),
            streak: 0,
            bestStreak: 0,
            totalCompletions: 0
          };

          // Конвертируем данные uHabits
          if (uhabit.entries) {
            uhabit.entries.forEach(entry => {
              const dateKey = format(parseISO(entry.date), 'yyyy-MM-dd');
              if (entry.value > 0) {
                habit.completed[dateKey] = true;
              }
            });
          }

          habit.totalCompletions = Object.keys(habit.completed).length;
          importedHabits.push(habit);
        });
      }

      setHabits([...habits, ...importedHabits]);
      setImportStatus(`Импортировано ${importedHabits.length} привычек из uHabits`);
      return true;
    } catch (error) {
      setImportStatus('Ошибка при импорте из uHabits');
      return false;
    }
  };

  // Импорт из Loop Habit Tracker
  const importFromLoopHabit = (data) => {
    try {
      const loopData = JSON.parse(data);
      const importedHabits = [];
      
      if (loopData.habits) {
        loopData.habits.forEach(loopHabit => {
          const habit = {
            id: Date.now() + Math.random(),
            name: loopHabit.name || 'Импортированная привычка',
            type: 'daily',
            category: 'binary',
            color: habitColors[Math.floor(Math.random() * habitColors.length)],
            target: 1,
            unit: '',
            reminderTime: '09:00',
            completed: {},
            values: {},
            mood: {},
            createdAt: new Date().toISOString(),
            streak: 0,
            bestStreak: 0,
            totalCompletions: 0
          };

          // Конвертируем данные Loop Habit Tracker
          if (loopHabit.repetitions) {
            loopHabit.repetitions.forEach(rep => {
              const dateKey = format(parseISO(rep.timestamp), 'yyyy-MM-dd');
              habit.completed[dateKey] = true;
            });
          }

          habit.totalCompletions = Object.keys(habit.completed).length;
          importedHabits.push(habit);
        });
      }

      setHabits([...habits, ...importedHabits]);
      setImportStatus(`Импортировано ${importedHabits.length} привычек из Loop Habit Tracker`);
      return true;
    } catch (error) {
      setImportStatus('Ошибка при импорте из Loop Habit Tracker');
      return false;
    }
  };

  // Импорт из CSV
  const importFromCSV = (data) => {
    try {
      const lines = data.split('\n');
      const importedHabits = [];
      const habitMap = new Map();

      // Парсим CSV
      lines.forEach((line, index) => {
        if (index === 0) return; // Пропускаем заголовок
        
        const columns = line.split(',');
        if (columns.length >= 3) {
          const habitName = columns[0].trim();
          const date = columns[1].trim();
          const value = columns[2].trim();

          if (!habitMap.has(habitName)) {
            const habit = {
              id: Date.now() + Math.random(),
              name: habitName,
              type: 'daily',
              category: 'binary',
              color: habitColors[Math.floor(Math.random() * habitColors.length)],
              target: 1,
              unit: '',
              reminderTime: '09:00',
              completed: {},
              values: {},
              mood: {},
              createdAt: new Date().toISOString(),
              streak: 0,
              bestStreak: 0,
              totalCompletions: 0
            };
            habitMap.set(habitName, habit);
          }

          const habit = habitMap.get(habitName);
          const dateKey = format(parseISO(date), 'yyyy-MM-dd');
          
          if (value === 'true' || value === '1' || value === 'yes') {
            habit.completed[dateKey] = true;
          }
        }
      });

      // Добавляем привычки
      habitMap.forEach(habit => {
        habit.totalCompletions = Object.keys(habit.completed).length;
        importedHabits.push(habit);
      });

      setHabits([...habits, ...importedHabits]);
      setImportStatus(`Импортировано ${importedHabits.length} привычек из CSV`);
      return true;
    } catch (error) {
      setImportStatus('Ошибка при импорте из CSV');
      return false;
    }
  };

  // Импорт из Daylio
  const importFromDaylio = (data) => {
    try {
      const lines = data.split('\n');
      const importedHabits = [];
      const moodHabit = {
        id: Date.now() + Math.random(),
        name: 'Настроение (Daylio)',
        type: 'daily',
        category: 'mood',
        color: '#667eea',
        target: 1,
        unit: '',
        reminderTime: '09:00',
        completed: {},
        values: {},
        mood: {},
        createdAt: new Date().toISOString(),
        streak: 0,
        bestStreak: 0,
        totalCompletions: 0
      };

      // Парсим CSV Daylio
      lines.forEach((line, index) => {
        if (index === 0) return; // Пропускаем заголовок
        
        const columns = line.split(',');
        if (columns.length >= 5) {
          const date = columns[0].trim();
          const mood = columns[4].trim();
          
          if (date && mood) {
            const dateKey = format(parseISO(date), 'yyyy-MM-dd');
            let moodValue = null;
            
            // Конвертируем настроения Daylio в числовые значения
            switch (mood) {
              case 'awful':
                moodValue = 1;
                break;
              case 'bad':
                moodValue = 2;
                break;
              case 'meh':
                moodValue = 3;
                break;
              case 'good':
                moodValue = 4;
                break;
              case 'rad':
                moodValue = 5;
                break;
              default:
                moodValue = null;
            }
            
            if (moodValue !== null) {
              moodHabit.mood[dateKey] = moodValue;
            }
          }
        }
      });

      moodHabit.totalCompletions = Object.keys(moodHabit.mood).length;
      importedHabits.push(moodHabit);

      setHabits([...habits, ...importedHabits]);
      setImportStatus(`Импортировано ${importedHabits.length} привычек из Daylio`);
      return true;
    } catch (error) {
      setImportStatus('Ошибка при импорте из Daylio');
      return false;
    }
  };

  // Импорт из Habit Tracker
  const importFromHabitTracker = (data) => {
    try {
      const lines = data.split('\n');
      const importedHabits = [];
      const habitMap = new Map();

      // Парсим CSV Habit Tracker
      lines.forEach((line, index) => {
        if (index === 0) return; // Пропускаем заголовок
        
        const columns = line.split(',');
        if (columns.length >= 3) {
          const habitName = columns[0].trim();
          const date = columns[1].trim();
          const value = columns[2].trim();

          if (!habitMap.has(habitName)) {
            const habit = {
              id: Date.now() + Math.random(),
              name: habitName,
              type: 'daily',
              category: 'binary',
              color: habitColors[Math.floor(Math.random() * habitColors.length)],
              target: 1,
              unit: '',
              reminderTime: '09:00',
              completed: {},
              values: {},
              mood: {},
              createdAt: new Date().toISOString(),
              streak: 0,
              bestStreak: 0,
              totalCompletions: 0
            };
            habitMap.set(habitName, habit);
          }

          const habit = habitMap.get(habitName);
          const dateKey = format(parseISO(date), 'yyyy-MM-dd');
          
          if (value === '1') {
            habit.completed[dateKey] = true;
          }
        }
      });

      // Добавляем привычки
      habitMap.forEach(habit => {
        habit.totalCompletions = Object.keys(habit.completed).length;
        importedHabits.push(habit);
      });

      setHabits([...habits, ...importedHabits]);
      setImportStatus(`Импортировано ${importedHabits.length} привычек из Habit Tracker`);
      return true;
    } catch (error) {
      setImportStatus('Ошибка при импорте из Habit Tracker');
      return false;
    }
  };

  // Импорт из Way of Life
  const importFromWayOfLife = (data) => {
    try {
      const lines = data.split('\n');
      const importedHabits = [];
      const habitMap = new Map();

      // Парсим CSV Way of Life
      lines.forEach((line, index) => {
        if (index === 0) return; // Пропускаем заголовок
        
        const columns = line.split(',');
        if (columns.length >= 2) {
          const date = columns[0].trim();
          
          // Обрабатываем каждую привычку в строке
          for (let i = 1; i < columns.length; i += 2) {
            const habitName = columns[i]?.trim();
            const value = columns[i + 1]?.trim();
            
            if (habitName && value && value !== '-') {
              if (!habitMap.has(habitName)) {
                const habit = {
                  id: Date.now() + Math.random(),
                  name: habitName,
                  type: 'daily',
                  category: 'binary',
                  color: habitColors[Math.floor(Math.random() * habitColors.length)],
                  target: 1,
                  unit: '',
                  reminderTime: '09:00',
                  completed: {},
                  values: {},
                  mood: {},
                  createdAt: new Date().toISOString(),
                  streak: 0,
                  bestStreak: 0,
                  totalCompletions: 0
                };
                habitMap.set(habitName, habit);
              }

              const habit = habitMap.get(habitName);
              
              // Конвертируем дату из DD.MM.YYYY в YYYY-MM-DD
              const dateParts = date.split('.');
              if (dateParts.length === 3) {
                const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
                const dateKey = format(parseISO(formattedDate), 'yyyy-MM-dd');
                
                if (value === 'Green') {
                  habit.completed[dateKey] = true;
                }
              }
            }
          }
        }
      });

      // Добавляем привычки
      habitMap.forEach(habit => {
        habit.totalCompletions = Object.keys(habit.completed).length;
        importedHabits.push(habit);
      });

      setHabits([...habits, ...importedHabits]);
      setImportStatus(`Импортировано ${importedHabits.length} привычек из Way of Life`);
      return true;
    } catch (error) {
      setImportStatus('Ошибка при импорте из Way of Life');
      return false;
    }
  };

  // Обработка импорта
  const handleImport = () => {
    setImportStatus('');
    
    if (!importData.trim()) {
      setImportStatus('Введите данные для импорта');
      return;
    }

    let success = false;

    switch (importSource) {
      case 'daylio':
        success = importFromDaylio(importData);
        break;
      case 'habit-tracker':
        success = importFromHabitTracker(importData);
        break;
      case 'way-of-life':
        success = importFromWayOfLife(importData);
        break;
      case 'uhabits':
        success = importFromUHabits(importData);
        break;
      case 'loop':
        success = importFromLoopHabit(importData);
        break;
      case 'csv':
        success = importFromCSV(importData);
        break;
      case 'custom':
        try {
          const customData = JSON.parse(importData);
          if (customData.habits) {
            setHabits([...habits, ...customData.habits]);
            setImportStatus(`Импортировано ${customData.habits.length} привычек`);
            success = true;
          } else {
            setImportStatus('Неверный формат данных');
          }
        } catch (error) {
          setImportStatus('Ошибка при парсинге JSON');
        }
        break;
      default:
        setImportStatus('Выберите источник данных');
    }

    if (success) {
      setImportData('');
      setTimeout(() => setShowImportModal(false), 2000);
    }
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

  // Импорт данных из файла
  const importDataFromFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.habits) {
            setHabits(data.habits);
            setImportStatus(`Импортировано ${data.habits.length} привычек из файла`);
          }
        } catch (error) {
          setImportStatus('Ошибка при импорте файла');
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

  // Настроения
  const moodOptions = [
    { value: 1, label: '😢', color: '#ef4444' },
    { value: 2, label: '😕', color: '#f97316' },
    { value: 3, label: '😐', color: '#eab308' },
    { value: 4, label: '🙂', color: '#22c55e' },
    { value: 5, label: '😊', color: '#10b981' }
  ];

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>Трекер привычек</h1>
            <p>Минималистичный подход к отслеживанию</p>
          </div>
          <div className="header-actions">
            {showInstallPrompt && (
              <button onClick={installPWA} className="header-button install-pwa" title="Установить приложение">
                📱
              </button>
            )}
            <button 
              onClick={() => {
                console.log('PWA Debug Info:');
                console.log('- Service Worker:', 'serviceWorker' in navigator);
                console.log('- Standalone mode:', window.matchMedia('(display-mode: standalone)').matches);
                console.log('- Manifest:', document.querySelector('link[rel="manifest"]')?.href);
                console.log('- Deferred prompt:', !!deferredPrompt);
                console.log('- Show install prompt:', showInstallPrompt);
              }} 
              className="header-button debug-pwa" 
              title="Отладка PWA"
              style={{fontSize: '12px'}}
            >
              🔧
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="theme-toggle"
              title={darkMode ? 'Светлая тема' : 'Темная тема'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setShowStats(!showStats)} className="header-button">
              <BarChart3 size={18} />
            </button>
            <button onClick={() => setShowStorageInfo(true)} className="header-button">
              <Settings size={18} />
            </button>
            <button onClick={() => setShowImportModal(true)} className="header-button">
              <Database size={18} />
            </button>
            <button onClick={exportData} className="header-button">
              <Download size={18} />
            </button>
            <label className="header-button">
              <Upload size={18} />
              <input
                type="file"
                accept=".json"
                onChange={importDataFromFile}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Компактная форма добавления */}
        <div className="add-habit-section">
          <button 
            onClick={() => setShowAddModal(true)}
            className="add-habit-button"
          >
            <Plus size={16} />
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
                  <label>Категория привычки</label>
                  <select 
                    value={habitCategory} 
                    onChange={(e) => setHabitCategory(e.target.value)}
                    className="habit-select"
                  >
                    <option value="binary">Бинарная (да/нет)</option>
                    <option value="quantity">Количественная</option>
                    <option value="mood">Настроение</option>
                  </select>
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

                {habitCategory === 'quantity' && (
                  <div className="form-group">
                    <label>Единица измерения</label>
                    <input
                      type="text"
                      value={habitUnit}
                      onChange={(e) => setHabitUnit(e.target.value)}
                      placeholder="шт, км, мин, кг..."
                      className="habit-input"
                    />
                  </div>
                )}

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

        {/* Модальное окно импорта */}
        {showImportModal && (
          <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
            <div className="modal import-modal" onClick={e => e.stopPropagation()}>
              <h2>Импорт данных</h2>
              <div className="modal-form">
                <div className="form-group">
                  <label>Источник данных</label>
                  <select 
                    value={importSource} 
                    onChange={(e) => setImportSource(e.target.value)}
                    className="habit-select"
                  >
                    <option value="custom">Собственный JSON</option>
                    <option value="uhabits">uHabits</option>
                    <option value="loop">Loop Habit Tracker</option>
                    <option value="csv">CSV файл</option>
                    <option value="daylio">Daylio</option>
                    <option value="habit-tracker">Habit Tracker</option>
                    <option value="way-of-life">Way of Life</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Данные для импорта</label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Вставьте данные для импорта..."
                    className="import-textarea"
                    rows={10}
                  />
                </div>

                {importStatus && (
                  <div className={`import-status ${importStatus.includes('Ошибка') ? 'error' : 'success'}`}>
                    {importStatus}
                  </div>
                )}

                <div className="import-instructions">
                  <h4>Инструкции по импорту:</h4>
                  <ul>
                    <li><strong>uHabits:</strong> Экспортируйте данные из uHabits в JSON формате</li>
                    <li><strong>Loop Habit Tracker:</strong> Используйте экспорт из Loop Habit Tracker</li>
                    <li><strong>CSV:</strong> Формат: привычка,дата,значение (заголовок обязателен)</li>
                    <li><strong>JSON:</strong> Собственный формат с массивом habits</li>
                    <li><strong>Daylio:</strong> Экспортируйте данные из Daylio в CSV формате (заголовок, дата, привычка, значение, настроение)</li>
                    <li><strong>Habit Tracker:</strong> Экспортируйте данные из Habit Tracker в CSV формате (заголовок, дата, значение)</li>
                    <li><strong>Way of Life:</strong> Экспортируйте данные из Way of Life в CSV формате (дата, привычка1, значение1, привычка2, значение2, ...)</li>
                  </ul>
                </div>

                <div className="modal-actions">
                  <button onClick={() => setShowImportModal(false)} className="cancel-button">
                    Отмена
                  </button>
                  <button onClick={handleImport} className="add-button">
                    Импортировать
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно управления данными */}
        {showStorageInfo && (
          <div className="modal-overlay" onClick={() => setShowStorageInfo(false)}>
            <div className="modal storage-modal" onClick={e => e.stopPropagation()}>
              <h2>Управление данными</h2>
              <div className="modal-form">
                <div className="storage-info">
                  <div className="info-section">
                    <h4>📊 Статистика</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Привычек:</span>
                        <span className="info-value">{getStorageInfo().habitsCount}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Размер данных:</span>
                        <span className="info-value">{getStorageInfo().totalSize} КБ</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Использовано:</span>
                        <span className="info-value">{getStorageInfo().storageUsed}%</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Последняя синхронизация:</span>
                        <span className="info-value">{getStorageInfo().lastSync}</span>
                      </div>
                    </div>
                  </div>

                  <div className="info-section">
                    <h4>🔄 Статус загрузки</h4>
                    <div className="load-status">
                      {dataLoadStatus || 'Готов к загрузке'}
                    </div>
                  </div>

                  <div className="info-section">
                    <h4>💾 Где хранятся данные</h4>
                    <div className="storage-details">
                      <p><strong>Локальное хранилище браузера (localStorage)</strong></p>
                      <ul>
                        <li>Данные сохраняются автоматически</li>
                        <li>Доступны только в этом браузере</li>
                        <li>Максимум 5-10 МБ (зависит от браузера)</li>
                        <li>Данные не передаются на сервер</li>
                        <li>Можно экспортировать в любой момент</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="storage-actions">
                  <button onClick={syncData} className="action-button sync">
                    <Upload size={16} />
                    Синхронизировать
                  </button>
                  <button onClick={exportData} className="action-button export">
                    <Download size={16} />
                    Экспортировать
                  </button>
                  <button onClick={clearData} className="action-button clear">
                    <X size={16} />
                    Очистить все
                  </button>
                </div>

                <div className="modal-actions">
                  <button onClick={() => setShowStorageInfo(false)} className="cancel-button">
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Компактная навигация по неделям */}
        <div className="week-navigation">
          <button onClick={goToPreviousWeek} className="nav-button">
            ←
          </button>
          <div className="current-week">
            <span>
              {format(currentWeek, 'd MMM', { locale: ru })} - {format(addDays(currentWeek, 6), 'd MMM yyyy', { locale: ru })}
            </span>
            <button onClick={goToCurrentWeek} className="current-week-button">
              Сегодня
            </button>
          </div>
          <button onClick={goToNextWeek} className="nav-button">
            →
          </button>
        </div>

        {/* Статистика */}
        {showStats && (
          <div className="stats-section">
            <h3>Статистика</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{habits.length}</div>
                <div className="stat-label">Привычек</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {habits.reduce((sum, habit) => sum + habit.totalCompletions, 0)}
                </div>
                <div className="stat-label">Выполнений</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {habits.reduce((sum, habit) => sum + habit.streak, 0)}
                </div>
                <div className="stat-label">Серия</div>
              </div>
            </div>
          </div>
        )}

        {/* Компактный список привычек */}
        <div className="habits-container">
          {habits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>Нет привычек</h3>
              <p>Добавьте первую привычку для начала</p>
            </div>
          ) : (
            <div className="habits-grid compact">
              {habits.map(habit => {
                const stats = getHabitStats(habit);
                return (
                  <div 
                    key={habit.id} 
                    className="habit-card compact" 
                    style={{ borderLeft: `3px solid ${habit.color}` }}
                    title={`Серия: ${stats.streak} | Выполнено: ${stats.completionRate}% | Всего: ${stats.totalCompletions}`}
                  >
                    <div className="habit-header compact">
                      <div className="habit-info">
                        <h3 className="habit-name">{habit.name}</h3>
                        <div className="habit-meta">
                          <span className="habit-category">
                            {getCategoryIcon(habit.category)}
                            {getCategoryName(habit.category)}
                          </span>
                          <span className="habit-type">{habit.type === 'daily' ? 'Ежедневная' : habit.type === 'weekly' ? 'Еженедельная' : 'Ежемесячная'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeHabit(habit.id)}
                        className="remove-button"
                        title="Удалить привычку"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    
                    {/* Статистика убрана для компактности */}
                    
                    <div className="habit-days compact">
                      {weekDays.map(day => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const isToday = isSameDay(day, new Date());
                        const habitValue = getHabitValue(habit, day);
                        
                        return (
                          <div 
                            key={day.toISOString()} 
                            className={`day-cell compact ${isToday ? 'today' : ''} ${habitValue ? 'completed' : ''}`}
                          >
                            <div className="day-header compact">
                              <span className="day-name">
                                {format(day, 'EEE', { locale: ru })}
                              </span>
                              <span className="day-date">
                                {format(day, 'd')}
                              </span>
                            </div>
                            
                            {habit.category === 'binary' && (
                              <button
                                onClick={() => toggleHabitCompletion(habit.id, day)}
                                className={`completion-button compact ${habitValue ? 'completed' : ''}`}
                                style={{ borderColor: habit.color }}
                                title={habitValue ? 'Отменить выполнение' : 'Отметить как выполненное'}
                              >
                                {habitValue ? <Check size={12} /> : <Minus size={12} />}
                              </button>
                            )}
                            
                            {habit.category === 'quantity' && (
                              <div className="quantity-input-container">
                                <input
                                  type="number"
                                  value={habitValue || ''}
                                  onChange={(e) => updateQuantityValue(habit.id, day, e.target.value)}
                                  className="quantity-input"
                                  placeholder="0"
                                  min="0"
                                  step="0.1"
                                />
                                {habit.unit && <span className="unit-label">{habit.unit}</span>}
                              </div>
                            )}
                            
                            {habit.category === 'mood' && (
                              <div className="mood-selector">
                                {moodOptions.map(mood => (
                                  <button
                                    key={mood.value}
                                    onClick={() => updateMoodValue(habit.id, day, habitValue === mood.value ? null : mood.value)}
                                    className={`mood-button ${habitValue === mood.value ? 'selected' : ''}`}
                                    style={{ backgroundColor: habitValue === mood.value ? mood.color : 'transparent' }}
                                    title={`Настроение ${mood.value}/5`}
                                  >
                                    {mood.label}
                                  </button>
                                ))}
                              </div>
                            )}
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