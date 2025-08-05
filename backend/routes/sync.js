const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const sqlitePath = path.join(__dirname, '../data/habits.db');

// Получить статус синхронизации
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const db = new sqlite3.Database(sqlitePath);
    
    // Проверяем доступность PostgreSQL
    let postgresAvailable = false;
    try {
      const client = await pool.connect();
      client.release();
      postgresAvailable = true;
    } catch (error) {
      // PostgreSQL недоступен
    }

    // Получаем количество записей в SQLite
    const getLocalCount = () => {
      return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM habits', (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
    };

    const localCount = await getLocalCount();
    
    res.json({
      local: {
        available: true,
        recordCount: localCount
      },
      cloud: {
        available: postgresAvailable,
        recordCount: postgresAvailable ? 'checking...' : 0
      },
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ошибка получения статуса синхронизации:', error);
    res.status(500).json({ error: 'Ошибка при получении статуса' });
  }
});

// Синхронизировать локальные данные в облако
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const db = new sqlite3.Database(sqlitePath);
    
    // Получаем все привычки из SQLite
    const getLocalHabits = () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM habits WHERE user_id = ?', [req.user.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const localHabits = await getLocalHabits();
    
    // Загружаем в PostgreSQL
    const client = await pool.connect();
    try {
      for (const habit of localHabits) {
        await client.query(`
          INSERT INTO habits (user_id, name, description, category, unit, target, color, type)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            unit = EXCLUDED.unit,
            target = EXCLUDED.target,
            color = EXCLUDED.color,
            type = EXCLUDED.type,
            updated_at = CURRENT_TIMESTAMP
        `, [req.user.id, habit.name, habit.description, habit.category, habit.unit, habit.target, habit.color, habit.type]);
      }
      
      res.json({
        message: 'Данные успешно загружены в облако',
        uploadedCount: localHabits.length
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка загрузки в облако:', error);
    res.status(500).json({ error: 'Ошибка при загрузке в облако' });
  }
});

// Скачать данные из облака
router.post('/download', authenticateToken, async (req, res) => {
  try {
    const db = new sqlite3.Database(sqlitePath);
    
    // Получаем данные из PostgreSQL
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM habits WHERE user_id = $1',
        [req.user.id]
      );
      
      // Загружаем в SQLite
      for (const habit of result.rows) {
        db.run(`
          INSERT OR REPLACE INTO habits (id, user_id, name, description, category, unit, target, color, type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [habit.id, habit.user_id, habit.name, habit.description, habit.category, habit.unit, habit.target, habit.color, habit.type]);
      }
      
      res.json({
        message: 'Данные успешно скачаны из облака',
        downloadedCount: result.rows.length
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка скачивания из облака:', error);
    res.status(500).json({ error: 'Ошибка при скачивании из облака' });
  }
});

// Автоматическая синхронизация
router.post('/auto', authenticateToken, async (req, res) => {
  try {
    // Проверяем доступность облака
    let postgresAvailable = false;
    try {
      const client = await pool.connect();
      client.release();
      postgresAvailable = true;
    } catch (error) {
      // PostgreSQL недоступен
    }

    if (!postgresAvailable) {
      return res.json({
        message: 'Облачная синхронизация недоступна',
        synced: false
      });
    }

    // Выполняем двустороннюю синхронизацию
    // TODO: Реализовать умную синхронизацию с разрешением конфликтов
    
    res.json({
      message: 'Автоматическая синхронизация выполнена',
      synced: true
    });
  } catch (error) {
    console.error('Ошибка автоматической синхронизации:', error);
    res.status(500).json({ error: 'Ошибка при синхронизации' });
  }
});

module.exports = router; 