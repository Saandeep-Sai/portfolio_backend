const express = require('express');
const { Contact } = require('../models');
const auth = require('../middleware/auth');
const notificationService = require('../services/notifications');
const aiService = require('../services/aiService');
const geoip = require('geoip-lite');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Submit contact form with validation
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('email').isEmail(),
  body('message').trim().isLength({ min: 1, max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, message } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    const contact = await Contact.create({
      name,
      email,
      message,
      ip,
      status: 'new'
    });
    
    // Send basic email notification
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `New Contact: ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
    }
    
    res.json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all contacts with filtering (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const { status, sentiment, limit = 20 } = req.query;
    
    let query = { 
      limit: parseInt(limit),
      orderBy: { field: 'createdAt', direction: 'desc' }
    };
    if (status) query.status = status;
    if (sentiment) query.sentiment = sentiment;
    
    const contacts = await Contact.find(query);
    const total = await Contact.count(status ? { status } : {});
    
    res.json({
      contacts,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update contact status (admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.update(req.params.id, { status });
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    // Send real-time update
    const io = req.app.get('io');
    io.to('admin').emit('contact-updated', {
      id: contact.id,
      status: contact.status
    });
    
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reply to contact (admin only)
router.post('/:id/reply', auth, [
  body('reply').trim().isLength({ min: 10, max: 2000 }).escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    const { reply } = req.body;
    
    // Send reply email
    await notificationService.sendEmail({
      to: contact.email,
      subject: `Re: Your message to Saandeep`,
      html: `
        <h2>Thank you for your message!</h2>
        <p>Hi ${contact.name},</p>
        <p>${reply}</p>
        <br>
        <p>Best regards,<br>Saandeep</p>
        <hr>
        <p><small>Original message: ${contact.message}</small></p>
      `
    });
    
    // Update contact status
    await Contact.update(req.params.id, { status: 'replied' });
    
    res.json({ message: 'Reply sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get contact statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    const total = await Contact.count();
    const newMessages = await Contact.count({ status: 'new' });
    const replied = await Contact.count({ status: 'replied' });
    
    res.json({
      total,
      newMessages,
      replied
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;