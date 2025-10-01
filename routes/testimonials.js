const express = require('express');
const { Testimonial } = require('../models');
const auth = require('../middleware/auth');
const { cache } = require('../config/database');
const router = express.Router();

// Get approved testimonials (cached)
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'testimonials:approved';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    const testimonials = await Testimonial.find({ 
      approved: true,
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
    await cache.set(cacheKey, testimonials, 3600);
    
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit testimonial
router.post('/', async (req, res) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    
    // Send notification to admin
    const io = req.app.get('io');
    io.to('admin').emit('new-testimonial', testimonial);
    
    // Send email notification
    const notificationService = require('../services/notifications');
    await notificationService.sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Testimonial Submitted',
      text: `New testimonial from ${testimonial.name} at ${testimonial.company}`
    });
    
    res.status(201).json({ message: 'Testimonial submitted for review' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all testimonials (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ orderBy: { field: 'createdAt', direction: 'desc' } });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve testimonial (admin only)
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const testimonial = await Testimonial.update(req.params.id, { approved: true });
    
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    
    await cache.del('testimonials:approved');
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete testimonial (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Testimonial.delete(req.params.id);
    await cache.del('testimonials:approved');
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;