require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT; 

const cors = require('cors');
const bodyParser = require('body-parser');

// Middlewares
app.use(express.static(__dirname));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
const authRoute = require('./routes/auth_route');
const userRoute = require('./routes/user_route');
const mejaRoute = require('./routes/meja_route');
const menuRoute = require('./routes/menu_route');
const transaksiRoute = require('./routes/transaksi_route');

app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/meja', mejaRoute);
app.use('/menu', menuRoute);
app.use('/transaksi', transaksiRoute);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});