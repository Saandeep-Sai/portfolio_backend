const express = require('express');
const { Skill } = require('../models');
const auth = require('../middleware/auth');
const { cache } = require('../config/database');
const router = express.Router();

// Get all skills (cached)
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'skills:all';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    const skills = await Skill.find({ orderBy: { field: 'order' } });
    await cache.set(cacheKey, skills, 3600);
    
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add skill (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    await cache.del('skills:all');
    res.status(201).json(skill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update skill (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.update(req.params.id, req.body);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    await cache.del('skills:all');
    res.json(skill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete skill (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Skill.delete(req.params.id);
    await cache.del('skills:all');
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;