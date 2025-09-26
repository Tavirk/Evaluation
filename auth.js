const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const User = require('../models/User');
const { ensureGuest } = require('../middleware/auth');

// ------------------ REGISTER ------------------ //

// register form
router.get('/register', ensureGuest, (req, res) => {
  res.render('register', { error: null, success: null, form: {} });
});

// register post
router.post('/register', ensureGuest, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.render('register', {
        error: 'Please fill all fields',
        success: null,
        form: req.body
      });
    }

    // 🚫 Prevent registering as admin
    if (email.toLowerCase() === 'admin@example.com') {
      return res.render('register', {
        error: 'Admin cannot be registered. Use the given credentials.',
        success: null,
        form: req.body
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.render('register', {
        error: 'Email already registered',
        success: null,
        form: req.body
      });
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email: email.toLowerCase(),
      password: hash,
      role: 'user' // ✅ Only user role allowed
    });

    return res.render('register', {
      error: null,
      success: 'Registration successful! Redirecting to login...',
      form: {}
    });
  } catch (err) {
    console.error(err);
    return res.render('register', {
      error: 'Server error',
      success: null,
      form: req.body
    });
  }
});

// ------------------ LOGIN ------------------ //

// login form
router.get('/login', ensureGuest, (req, res) => {
  res.render('login', { error: null, success: null, form: {} });
});

// login post
router.post('/login', ensureGuest, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.render('login', {
        error: 'Enter all fields',
        success: null,
        form: req.body
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.render('login', {
        error: 'Invalid credentials',
        success: null,
        form: req.body
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', {
        error: 'Invalid credentials',
        success: null,
        form: req.body
      });
    }

    // ✅ Login success → redirect immediately
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    return res.redirect('/');
  } catch (err) {
    console.error(err);
    return res.render('login', {
      error: 'Server error',
      success: null,
      form: req.body
    });
  }
});

// ------------------ LOGOUT ------------------ //
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
});

// 🔹 Ensure default admin exists on startup
async function ensureAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hash = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: hash,
        role: 'admin'
      });
      console.log('✅ Default admin created: admin@example.com / admin123');
    } else {
      console.log('ℹ️ Admin already exists');
    }
  } catch (err) {
    console.error('Error ensuring admin:', err);
  }
}
ensureAdmin();

module.exports = router;
