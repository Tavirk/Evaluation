const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');
const Category = require('../models/Category');
const News = require('../models/News');



// Home page
router.get("/", async (req, res) => {
  try {
    // Fetch latest 5 news → Trending
    const trendingNews = await News.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Exclude those 5 from main feed
    const trendingIds = trendingNews.map(n => n._id);

    const allNews = await News.find({ _id: { $nin: trendingIds } })
      .sort({ createdAt: -1 })
      .lean();

    res.render("home", {
      currentUser: req.session.user || null,
      trendingNews,   // max 5 items
      allNews         // everything else
    });
  } catch (err) {
    console.error("Error fetching home news:", err);
    res.render("home", {
      currentUser: req.session.user || null,
      trendingNews: [],
      allNews: []
    });
  }
});



// all categories
router.get('/categories', ensureAuth, async (req, res) => {
  try {
    const categories = await Category.find({}).lean();
    res.render('categories', { categories });
  } catch (err) {
    console.error('Error loading categories', err);
    req.session.error_msg = 'Failed to load categories';
    res.redirect('/');
  }
});

// single category → show only that category's news
// single category → show only that category's news
router.get('/categories/:name', ensureAuth, async (req, res) => {
  try {
    const categoryName = req.params.name;

    // find category
    const category = await Category.findOne({ name: categoryName }).lean();
    if (!category) {
      return res.status(404).send('Category not found');
    }

    // find news belonging to this category
    const newsList = await News.find({ category: categoryName }).lean();

    // pass newsList as "news"
    res.render('category', { category, news: newsList });
  } catch (err) {
    console.error('Error loading category', err);
    req.session.error_msg = 'Failed to load category';
    res.redirect('/categories');
  }
});

module.exports = router;
