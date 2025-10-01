const express = require('express');
const auth = require('../middleware/auth');
const notificationService = require('../services/notifications');
const router = express.Router();

// Send email notification (admin only)
router.post('/email', auth, async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    await notificationService.sendEmail({ to, subject, text, html });
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send Discord notification (admin only)
router.post('/discord', auth, async (req, res) => {
  try {
    const { message } = req.body;
    await notificationService.sendDiscordNotification(message);
    res.json({ message: 'Discord notification sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test notification channels (admin only)
router.post('/test', auth, async (req, res) => {
  try {
    const testMessage = 'Portfolio notification system test';
    
    const results = {
      email: false,
      discord: false
    };
    
    // Test email
    try {
      await notificationService.sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'Test Notification',
        text: testMessage
      });
      results.email = true;
    } catch (error) {
      console.error('Email test failed:', error);
    }
    
    // Test Discord
    try {
      await notificationService.sendDiscordNotification(testMessage);
      results.discord = true;
    } catch (error) {
      console.error('Discord test failed:', error);
    }
    
    res.json({ message: 'Notification tests completed', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;