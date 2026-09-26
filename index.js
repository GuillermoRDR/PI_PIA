const express = require('express');
const cors = require('cors');
const path = require('path');
const rutas = require('./router');
require('./config/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'views')));

app.use(rutas);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
