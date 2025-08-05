const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const syncRoutes = require('./routes/sync');
const {
  connectDB,
  createTables,
  createSQLiteDB,
  createSQLiteTables
} = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/sync', syncRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      sqlite: 'available',
      postgresql: process.env.DB_HOST ? 'configured' : 'not configured'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Что-то пошло не так!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Внутренняя ошибка сервера'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Start server
const startServer = async () => {
  try {
    // Инициализация SQLite (локальная база)
    const sqliteDB = await createSQLiteDB();
    await createSQLiteTables(sqliteDB);

    // Попытка подключения к PostgreSQL (облачная база)
    let postgresAvailable = false;
    if (process.env.DB_HOST) {
      try {
        await connectDB();
        await createTables();
        postgresAvailable = true;
        console.log('✅ Облачная синхронизация доступна');
      } catch (error) {
        console.log('⚠️ Облачная синхронизация недоступна, работаем только локально');
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📊 Режим: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`💾 Локальная БД: SQLite (${postgresAvailable ? 'с' : 'без'} облачной синхронизации)`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

startServer(); 