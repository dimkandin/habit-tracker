const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Получить все привычки пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT h.*, 
                COALESCE(hc.completed, false) as completed,
                hv.value as quantity_value,
                hm.mood_value
         FROM habits h
         LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.date = CURRENT_DATE
         LEFT JOIN habit_values hv ON h.id = hv.habit_id AND hv.date = CURRENT_DATE
         LEFT JOIN habit_moods hm ON h.id = hm.habit_id AND hm.date = CURRENT_DATE
         WHERE h.user_id = $1
         ORDER BY h.created_at DESC`,
        [req.user.id]
      );

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка получения привычек:', error);
    res.status(500).json({ error: 'Ошибка при получении привычек' });
  }
});

// Создать новую привычку
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, category, unit, target } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Название и категория обязательны' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO habits (user_id, name, description, category, unit, target)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user.id, name, description, category, unit, target]
      );

      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка создания привычки:', error);
    res.status(500).json({ error: 'Ошибка при создании привычки' });
  }
});

// Обновить привычку
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, unit, target } = req.body;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE habits 
         SET name = $1, description = $2, category = $3, unit = $4, target = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [name, description, category, unit, target, id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Привычка не найдена' });
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка обновления привычки:', error);
    res.status(500).json({ error: 'Ошибка при обновлении привычки' });
  }
});

// Удалить привычку
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Привычка не найдена' });
      }

      res.json({ message: 'Привычка удалена' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка удаления привычки:', error);
    res.status(500).json({ error: 'Ошибка при удалении привычки' });
  }
});

// Отметить выполнение бинарной привычки
router.post('/:id/completion', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, date = new Date().toISOString().split('T')[0] } = req.body;

    const client = await pool.connect();
    try {
      // Проверяем, что привычка принадлежит пользователю и является бинарной
      const habitCheck = await client.query(
        'SELECT category FROM habits WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (habitCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Привычка не найдена' });
      }

      if (habitCheck.rows[0].category !== 'binary') {
        return res.status(400).json({ error: 'Эта привычка не является бинарной' });
      }

      // Обновляем или создаем запись о выполнении
      await client.query(
        `INSERT INTO habit_completions (habit_id, date, completed)
         VALUES ($1, $2, $3)
         ON CONFLICT (habit_id, date)
         DO UPDATE SET completed = $3, updated_at = CURRENT_TIMESTAMP`,
        [id, date, completed]
      );

      res.json({ message: 'Выполнение обновлено' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка обновления выполнения:', error);
    res.status(500).json({ error: 'Ошибка при обновлении выполнения' });
  }
});

// Обновить количественное значение
router.post('/:id/value', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { value, date = new Date().toISOString().split('T')[0] } = req.body;

    const client = await pool.connect();
    try {
      // Проверяем, что привычка принадлежит пользователю и является количественной
      const habitCheck = await client.query(
        'SELECT category FROM habits WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (habitCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Привычка не найдена' });
      }

      if (habitCheck.rows[0].category !== 'quantity') {
        return res.status(400).json({ error: 'Эта привычка не является количественной' });
      }

      // Обновляем или создаем запись о значении
      await client.query(
        `INSERT INTO habit_values (habit_id, date, value)
         VALUES ($1, $2, $3)
         ON CONFLICT (habit_id, date)
         DO UPDATE SET value = $3, updated_at = CURRENT_TIMESTAMP`,
        [id, date, value]
      );

      res.json({ message: 'Значение обновлено' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка обновления значения:', error);
    res.status(500).json({ error: 'Ошибка при обновлении значения' });
  }
});

// Обновить настроение
router.post('/:id/mood', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { mood_value, date = new Date().toISOString().split('T')[0] } = req.body;

    const client = await pool.connect();
    try {
      // Проверяем, что привычка принадлежит пользователю и является настроением
      const habitCheck = await client.query(
        'SELECT category FROM habits WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (habitCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Привычка не найдена' });
      }

      if (habitCheck.rows[0].category !== 'mood') {
        return res.status(400).json({ error: 'Эта привычка не является настроением' });
      }

      // Обновляем или создаем запись о настроении
      await client.query(
        `INSERT INTO habit_moods (habit_id, date, mood_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (habit_id, date)
         DO UPDATE SET mood_value = $3, updated_at = CURRENT_TIMESTAMP`,
        [id, date, mood_value]
      );

      res.json({ message: 'Настроение обновлено' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка обновления настроения:', error);
    res.status(500).json({ error: 'Ошибка при обновлении настроения' });
  }
});

module.exports = router; 