const express = require('express');
const { Achievement } = require('../models');
const auth = require('../middleware/auth');
const { cache } = require('../config/database');
const router = express.Router();

// Get all achievements (cached)
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'achievements:all';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    const achievements = await Achievement.find({});
    achievements.sort((a, b) => new Date(b.date) - new Date(a.date));
    await cache.set(cacheKey, achievements, 3600);
    
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add achievement (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const achievement = await Achievement.create(req.body);
    await cache.del('achievements:all');
    
    // Send real-time notification
    const io = req.app.get('io');
    io.to('admin').emit('new-achievement', achievement);
    
    res.status(201).json(achievement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update achievement (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const achievement = await Achievement.update(req.params.id, req.body);
    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    await cache.del('achievements:all');
    res.json(achievement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete achievement (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Achievement.delete(req.params.id);
    await cache.del('achievements:all');
    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;