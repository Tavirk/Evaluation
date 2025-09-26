require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const indexRoutes = require('./routes/index');

const app = express();

// ---- Configuration ----
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/newsdb';

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// static
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));

// ---- DB ----
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Mongo connection error', err);
});

// ---- Session ----
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// expose currentUser to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// ---- Flash middleware: copy session flash messages to res.locals and clear them ----
// This ensures templates like news.ejs can safely reference success_msg / error_msg
app.use((req, res, next) => {
  res.locals.success_msg = req.session.success_msg || null;
  res.locals.error_msg = req.session.error_msg || null;
  // Clear them so they don't persist
  delete req.session.success_msg;
  delete req.session.error_msg;
  next();
});

// ---- Routes ----
// mount news routes before index so /news is handled by newsRoutes (avoid duplication)
app.use('/', authRoutes);
app.use('/news', newsRoutes);
app.use('/', indexRoutes);


const Category = require("./models/Category");

app.use(async (req, res, next) => {
  try {
    res.locals.categories = await Category.find({}).lean();
  } catch (e) {
    res.locals.categories = [];
  }
  next();
});

// ---- 404 ----
app.use((req, res) => {
  res.status(404).send('Not found');
});

// ---- start ----
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
