const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
    })
  });
}

const db = admin.firestore();

// Simple cache using Firestore
const cache = {
  async get(key) {
    try {
      const doc = await db.collection('cache').doc(key).get();
      if (doc.exists) {
        const data = doc.data();
        if (data.expires > Date.now()) {
          return data.value;
        }
        await db.collection('cache').doc(key).delete();
      }
      return null;
    } catch (error) {
      return null;
    }
  },
  
  async set(key, value, ttl = 3600) {
    try {
      await db.collection('cache').doc(key).set({
        value,
        expires: Date.now() + (ttl * 1000)
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },
  
  async del(key) {
    try {
      await db.collection('cache').doc(key).delete();
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
};

module.exports = { db, cache };