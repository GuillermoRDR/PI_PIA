const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error al conectar a PostgreSql en Render:', err.stack);
  }
  console.log('¡Conexion exitosa a PostgreSql en Render!');
  release();
});

module.exports = pool;