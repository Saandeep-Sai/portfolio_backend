const express = require('express');
const { Analytics, Contact, Project, Blog } = require('../models');
const auth = require('../middleware/auth');
const { cache, db } = require('../config/database');
const firebaseService = require('../services/firebaseService');
const geoip = require('geoip-lite');
const router = express.Router();

// Track page view
router.post('/track', async (req, res) => {
  try {
    const { page, event, data } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    
    const analytics = await Analytics.create({
      page,
      event,
      data,
      ip,
      userAgent: req.get('User-Agent'),
      country: geo?.country || 'Unknown',
      city: geo?.city || 'Unknown',
      sessionId: req.sessionID,
      referrer: req.get('Referrer') || 'Direct'
    });
    
    // Update real-time stats in Firestore
    const today = new Date().toISOString().split('T')[0];
    const statsRef = db.collection('stats').doc('daily');
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(statsRef);
      const data = doc.exists ? doc.data() : {};
      data[`views_${today}`] = (data[`views_${today}`] || 0) + 1;
      data[`pages_${page}_${today}`] = (data[`pages_${page}_${today}`] || 0) + 1;
      transaction.set(statsRef, data, { merge: true });
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comprehensive analytics dashboard (admin only)
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cacheKey = 'analytics:dashboard';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get analytics data
    const totalViews = await Analytics.count();
    const monthlyViews = await Analytics.count({ 
      createdAt: { '>=': thirtyDaysAgo }
    });
    
    // Get contact and project data
    const totalContacts = await Contact.count();
    const newContacts = await Contact.count({ status: 'new' });
    
    const dashboard = {
      overview: {
        totalViews,
        monthlyViews,
        totalContacts,
        newContacts
      }
    };
    
    await cache.set(cacheKey, dashboard, 300);
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get real-time stats
router.get('/realtime', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsDoc = await db.collection('stats').doc('daily').get();
    const statsData = statsDoc.exists ? statsDoc.data() : {};
    const todayViews = statsData[`views_${today}`] || 0;
    
    res.json({
      todayViews,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics data with filters (admin only)
router.get('/data', auth, async (req, res) => {
  try {
    const { page, country, limit = 100 } = req.query;
    
    let query = { limit: parseInt(limit) };
    if (page) query.page = page;
    if (country) query.country = country;
    
    const analytics = await Analytics.find(query);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;