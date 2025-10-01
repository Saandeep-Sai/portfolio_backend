const { db } = require('../config/database');

// Firebase Firestore collections
const collections = {
  analytics: 'analytics',
  contacts: 'contacts',
  projects: 'projects',
  blogs: 'blogs',
  comments: 'comments',
  skills: 'skills',
  achievements: 'achievements',
  testimonials: 'testimonials',
  users: 'users'
};

// Helper functions for Firestore operations
const FirebaseModel = (collectionName) => ({
  async create(data) {
    const docRef = await db.collection(collectionName).add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { id: docRef.id, ...data };
  },

  async findById(id) {
    const doc = await db.collection(collectionName).doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async find(query = {}) {
    let ref = db.collection(collectionName);
    
    // Apply filters
    Object.entries(query).forEach(([key, value]) => {
      if (key !== 'limit' && key !== 'orderBy') {
        ref = ref.where(key, '==', value);
      }
    });

    // Apply ordering
    if (query.orderBy) {
      ref = ref.orderBy(query.orderBy.field, query.orderBy.direction || 'desc');
    }

    // Apply limit
    if (query.limit) {
      ref = ref.limit(query.limit);
    }

    const snapshot = await ref.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async update(id, data) {
    await db.collection(collectionName).doc(id).update({
      ...data,
      updatedAt: new Date()
    });
    return this.findById(id);
  },

  async delete(id) {
    await db.collection(collectionName).doc(id).delete();
    return true;
  },

  async count(query = {}) {
    let ref = db.collection(collectionName);
    
    Object.entries(query).forEach(([key, value]) => {
      ref = ref.where(key, '==', value);
    });

    const snapshot = await ref.get();
    return snapshot.size;
  }
});

module.exports = {
  Analytics: FirebaseModel(collections.analytics),
  Contact: FirebaseModel(collections.contacts),
  Project: FirebaseModel(collections.projects),
  Blog: FirebaseModel(collections.blogs),
  Comment: FirebaseModel(collections.comments),
  Skill: FirebaseModel(collections.skills),
  Achievement: FirebaseModel(collections.achievements),
  Testimonial: FirebaseModel(collections.testimonials),
  User: FirebaseModel(collections.users)
};