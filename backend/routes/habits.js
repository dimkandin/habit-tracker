const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const sqlitePath = path.join(__dirname, '../data/habits.db');

// Получить все привычки пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = new sqlite3.Database(sqlitePath);
    
    const getHabits = () => {
      return new Promise((resolve, reject) => {
        db.all(`
          SELECT h.*, 
                 COALESCE(hc.completed, 0) as completed,
                 hv.value as quantity_value,
                 hm.mood_value
          FROM habits h
          LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.date = date('now')
          LEFT JOIN habit_values hv ON h.id = hv.habit_id AND hv.date = date('now')
          LEFT JOIN habit_moods hm ON h.id = hm.habit_id AND hm.date = date('now')
          WHERE h.user_id = ?
          ORDER BY h.created_at DESC
        `, [req.user.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const habits = await getHabits();
    res.json(habits);
  } catch (error) {
    console.error('Ошибка получения привычек:', error);
    res.status(500).json({ error: 'Ошибка при получении привычек' });
  }
});

// Создать новую привычку
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, category, unit, target, color, type } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Название и категория обязательны' });
    }

    const db = new sqlite3.Database(sqlitePath);
    
    const createHabit = () => {
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO habits (user_id, name, description, category, unit, target, color, type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [req.user.id, name, description, category, unit, target || 1, color || '#667eea', type || 'daily'], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
    };

    const habitId = await createHabit();
    
    // Получаем созданную привычку
    const getHabit = () => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM habits WHERE id = ?', [habitId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    };

    const habit = await getHabit();
    res.status(201).json(habit);
  } catch (error) {
    console.error('Ошибка создания привычки:', error);
    res.status(500).json({ error: 'Ошибка при создании привычки' });
  }
});

// Обновить привычку
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, unit, target, color, type } = req.body;

    const db = new sqlite3.Database(sqlitePath);
    
    const updateHabit = () => {
      return new Promise((resolve, reject) => {
        db.run(`
          UPDATE habits 
          SET name = ?, description = ?, category = ?, unit = ?, target = ?, color = ?, type = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `, [name, description, category, unit, target, color, type, id, req.user.id], function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        });
      });
    };

    const updated = await updateHabit();
    
    if (!updated) {
      return res.status(404).json({ error: 'Привычка не найдена' });
    }

    res.json({ message: 'Привычка обновлена' });
  } catch (error) {
    console.error('Ошибка обновления привычки:', error);
    res.status(500).json({ error: 'Ошибка при обновлении привычки' });
  }
});

// Удалить привычку
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = new sqlite3.Database(sqlitePath);
    
    const deleteHabit = () => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id], function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        });
      });
    };

    const deleted = await deleteHabit();
    
    if (!deleted) {
      return res.status(404).json({ error: 'Привычка не найдена' });
    }

    res.json({ message: 'Привычка удалена' });
  } catch (error) {
    console.error('Ошибка удаления привычки:', error);
    res.status(500).json({ error: 'Ошибка при удалении привычки' });
  }
});

// Отметить выполнение бинарной привычки
router.post('/:id/completion', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, completed } = req.body;

    const db = new sqlite3.Database(sqlitePath);
    
    const toggleCompletion = () => {
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO habit_completions (habit_id, date, completed, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [id, date, completed ? 1 : 0], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    };

    await toggleCompletion();
    res.json({ message: 'Выполнение обновлено' });
  } catch (error) {
    console.error('Ошибка обновления выполнения:', error);
    res.status(500).json({ error: 'Ошибка при обновлении выполнения' });
  }
});

// Обновить количественное значение
router.post('/:id/value', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, value } = req.body;

    const db = new sqlite3.Database(sqlitePath);
    
    const updateValue = () => {
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO habit_values (habit_id, date, value, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [id, date, value], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    };

    await updateValue();
    res.json({ message: 'Значение обновлено' });
  } catch (error) {
    console.error('Ошибка обновления значения:', error);
    res.status(500).json({ error: 'Ошибка при обновлении значения' });
  }
});

// Обновить настроение
router.post('/:id/mood', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, moodValue } = req.body;

    const db = new sqlite3.Database(sqlitePath);
    
    const updateMood = () => {
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO habit_moods (habit_id, date, mood_value, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [id, date, moodValue], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    };

    await updateMood();
    res.json({ message: 'Настроение обновлено' });
  } catch (error) {
    console.error('Ошибка обновления настроения:', error);
    res.status(500).json({ error: 'Ошибка при обновлении настроения' });
  }
});

module.exports = router; 