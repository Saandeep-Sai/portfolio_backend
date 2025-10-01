const { db } = require('../config/firebase');

class FirebaseService {
  // Analytics
  async trackAnalytics(data) {
    try {
      const docRef = await db.collection('analytics').add({
        ...data,
        timestamp: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Analytics tracking failed:', error);
      throw error;
    }
  }

  async getAnalyticsDashboard() {
    try {
      const analytics = await db.collection('analytics').get();
      const data = analytics.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const pageViews = data.filter(item => item.type === 'page_view').length;
      const contactForms = data.filter(item => item.type === 'contact_form').length;
      const projectClicks = data.filter(item => item.type === 'project_click').length;
      
      return { pageViews, contactForms, projectClicks, data };
    } catch (error) {
      console.error('Analytics dashboard failed:', error);
      throw error;
    }
  }

  // Projects
  async getProjects() {
    try {
      const projects = await db.collection('projects').orderBy('order').get();
      return projects.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get projects failed:', error);
      throw error;
    }
  }

  async createProject(data) {
    try {
      const docRef = await db.collection('projects').add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Create project failed:', error);
      throw error;
    }
  }

  async updateProject(id, data) {
    try {
      await db.collection('projects').doc(id).update({
        ...data,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Update project failed:', error);
      throw error;
    }
  }

  async deleteProject(id) {
    try {
      await db.collection('projects').doc(id).delete();
      return true;
    } catch (error) {
      console.error('Delete project failed:', error);
      throw error;
    }
  }

  // Blog
  async getBlogs(published = true) {
    try {
      let query = db.collection('blogs');
      if (published) {
        query = query.where('published', '==', true);
      }
      const blogs = await query.orderBy('createdAt', 'desc').get();
      return blogs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get blogs failed:', error);
      throw error;
    }
  }

  async getBlogBySlug(slug) {
    try {
      const blog = await db.collection('blogs').where('slug', '==', slug).get();
      if (blog.empty) return null;
      
      const doc = blog.docs[0];
      const data = { id: doc.id, ...doc.data() };
      
      // Increment views
      await doc.ref.update({ views: (data.views || 0) + 1 });
      
      return data;
    } catch (error) {
      console.error('Get blog by slug failed:', error);
      throw error;
    }
  }

  async createBlog(data) {
    try {
      const docRef = await db.collection('blogs').add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0
      });
      return docRef.id;
    } catch (error) {
      console.error('Create blog failed:', error);
      throw error;
    }
  }

  // Achievements
  async getAchievements() {
    try {
      const achievements = await db.collection('achievements').orderBy('date', 'desc').get();
      return achievements.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get achievements failed:', error);
      throw error;
    }
  }

  async createAchievement(data) {
    try {
      const docRef = await db.collection('achievements').add({
        ...data,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Create achievement failed:', error);
      throw error;
    }
  }

  // Users
  async createUser(data) {
    try {
      const docRef = await db.collection('users').add({
        ...data,
        createdAt: new Date(),
        lastLogin: null,
        isActive: true
      });
      return docRef.id;
    } catch (error) {
      console.error('Create user failed:', error);
      throw error;
    }
  }

  async getUserByUsername(username) {
    try {
      const user = await db.collection('users').where('username', '==', username).get();
      if (user.empty) return null;
      
      const doc = user.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Get user failed:', error);
      throw error;
    }
  }

  async updateUserLogin(userId) {
    try {
      await db.collection('users').doc(userId).update({
        lastLogin: new Date()
      });
      return true;
    } catch (error) {
      console.error('Update user login failed:', error);
      throw error;
    }
  }
}

module.exports = new FirebaseService();