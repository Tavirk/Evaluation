const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const News = require('../models/News');

// Middleware: ensure user is logged-in
function ensureAuth(req, res, next) {
  if (req.session.user) return next();
  return res.redirect('/login');
}
function ensureAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  return res.status(403).send('Forbidden: Admins only');
}

// ---------------- Admin Routes ----------------

// GET /news (Admin dashboard: add news form)
router.get('/', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const categories = await Category.find({}).lean();
    res.render('news', { categories });
  } catch (err) {
    console.error('Error fetching categories', err);
    req.session.error_msg = 'Failed to load news page';
    return res.redirect('/');
  }
});

// POST /news/add (Admin adds news)
router.post('/add', ensureAuth, ensureAdmin, async (req, res) => {
  const { title, category, content } = req.body;
  if (!title || !category || !content) {
    req.session.error_msg = 'All fields are required';
    return res.redirect('/news');
  }

  try {
    // Ensure category exists
    let cat = await Category.findOne({ name: new RegExp(`^${category}$`, 'i') });
    if (!cat) {
      cat = new Category({ name: category });
      await cat.save();
    }

    // Save news in News collection
    const newsItem = new News({
      title,
      content,
      category: cat.name
    });
    await newsItem.save();

    req.session.success_msg = 'News added successfully!';
    res.redirect('/news');
  } catch (err) {
    console.error('Error adding news', err);
    req.session.error_msg = 'Error adding news';
    res.redirect('/news');
  }
});

// ---------------- User Routes ----------------

// GET /categories/:name (User sees news in category)
router.get("/categories/:name", async (req, res) => {
  try {
    const category = await Category.findOne({ name: req.params.name });
    const news = await News.find({ category: req.params.name });

    // 🔥 Fetch trending news (latest 5 globally)
    const trendingNews = await News.find().sort({ createdAt: -1 }).limit(5);

    res.render("category", { category, news, trendingNews }); // ✅ Pass it here
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
