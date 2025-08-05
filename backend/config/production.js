module.exports = {
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  },
  cors: {
    origin: [
      'https://dimkandin.github.io',
      'https://habit-tracker.railway.app',
      'http://localhost:3000'
    ],
    credentials: true
  },
  server: {
    port: process.env.PORT || 5000,
    environment: 'production'
  }
}; 