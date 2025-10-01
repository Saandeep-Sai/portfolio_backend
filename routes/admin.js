const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Project, Blog, Achievement } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await User.find({ username });
    const user = users[0];
    
    if (!user || user.role !== 'admin' || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    await User.update(user.id, { lastLogin: new Date() });
    
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const totalProjects = await Project.count();
    const totalBlogs = await Blog.count();
    const totalAchievements = await Achievement.count();
    
    res.json({
      totalProjects,
      totalBlogs,
      totalAchievements
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;