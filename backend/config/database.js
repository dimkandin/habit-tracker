const { Pool } = require('pg');

// Создание пула подключений к PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // максимальное количество подключений в пуле
  idleTimeoutMillis: 30000, // время жизни неактивного подключения
  connectionTimeoutMillis: 2000, // время ожидания подключения
});

// Функция для тестирования подключения
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Подключение к PostgreSQL успешно установлено');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к PostgreSQL:', error.message);
    return false;
  }
};

// Функция для создания таблиц
const createTables = async () => {
  const client = await pool.connect();
  try {
    // Создание таблицы пользователей
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы привычек
    await client.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL CHECK (category IN ('binary', 'quantity', 'mood')),
        unit VARCHAR(50),
        target NUMERIC DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы выполнения бинарных привычек
    await client.query(`
      CREATE TABLE IF NOT EXISTS habit_completions (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(habit_id, date)
      )
    `);

    // Создание таблицы количественных значений
    await client.query(`
      CREATE TABLE IF NOT EXISTS habit_values (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        value NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(habit_id, date)
      )
    `);

    // Создание таблицы настроений
    await client.query(`
      CREATE TABLE IF NOT EXISTS habit_moods (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        mood_value INTEGER NOT NULL CHECK (mood_value >= 1 AND mood_value <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(habit_id, date)
      )
    `);

    // Создание индексов для оптимизации
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
      CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
      CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(date);
      CREATE INDEX IF NOT EXISTS idx_habit_values_habit_id ON habit_values(habit_id);
      CREATE INDEX IF NOT EXISTS idx_habit_values_date ON habit_values(date);
      CREATE INDEX IF NOT EXISTS idx_habit_moods_habit_id ON habit_moods(habit_id);
      CREATE INDEX IF NOT EXISTS idx_habit_moods_date ON habit_moods(date);
    `);

    console.log('✅ Таблицы базы данных созданы/обновлены');
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  connectDB,
  createTables
}; 