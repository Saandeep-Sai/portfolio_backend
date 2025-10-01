const { GoogleGenerativeAI } = require('@google/generative-ai');
const Sentiment = require('sentiment');
const { Project, Blog, Skill } = require('../models');

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.sentiment = new Sentiment();
  }
  
  async generateProjectDescription(title, technologies) {
    try {
      const prompt = `Generate a professional project description for a project titled "${title}" using technologies: ${technologies.join(', ')}. Keep it concise and engaging.`;
      
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('AI description generation failed:', error);
      return null;
    }
  }
  
  async analyzeSentiment(text) {
    try {
      // Use local sentiment analysis for faster response
      const result = this.sentiment.analyze(text);
      
      if (result.score > 2) return 'positive';
      if (result.score < -2) return 'negative';
      return 'neutral';
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return 'neutral';
    }
  }
  
  async getChatbotResponse(message) {
    try {
      const db = require('../config/database').db;
      
      // Get context data from Firestore - simplified queries to avoid index requirements
      const [projectsSnapshot, skillsSnapshot, blogsSnapshot] = await Promise.all([
        db.collection('projects').limit(5).get(), // Get first 5 projects
        db.collection('skills').limit(10).get(),
        db.collection('blogs').limit(5).get()     // Get first 5 blogs
      ]);
      
      const contextInfo = {
        projects: projectsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return { title: data.title, technologies: data.technologies };
          })
          .filter(p => p.title && p.technologies), // Only include projects with valid data
        skills: skillsSnapshot.docs
          .map(doc => doc.data().name)
          .filter(name => name), // Only include skills with valid names
        recentBlogs: blogsSnapshot.docs
          .map(doc => doc.data().title)
          .filter(title => title) // Only include blogs with valid titles
      };
      
      const prompt = `You are a helpful assistant for Saandeep's portfolio website. 
      You can answer questions about his skills, projects, experience, and contact information.
      
      Current projects: ${JSON.stringify(contextInfo.projects)}
      Skills: ${contextInfo.skills.join(', ')}
      Recent blog posts: ${contextInfo.recentBlogs.join(', ')}
      
      Keep responses concise, professional, and helpful. If asked about contact, direct them to the contact form.
      
      User question: ${message}`;
      
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Chatbot response failed:', error);
      return "I'm sorry, I'm having trouble responding right now. Please try again later or contact Saandeep directly through the contact form.";
    }
  }
  
  async recommendProjects(userInterests) {
    try {
      const db = require('../config/database').db;
      const projectsSnapshot = await db.collection('projects').get();
      const allProjects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const prompt = `Based on user interests, recommend the most relevant projects from the list. Return project IDs as JSON array.
      User interests: ${userInterests}
      Projects: ${JSON.stringify(allProjects.map(p => ({ id: p.id, title: p.title, technologies: p.technologies })))}`;
      
      const result = await this.model.generateContent(prompt);
      const recommendedIds = JSON.parse(result.response.text());
      return allProjects.filter(p => recommendedIds.includes(p.id));
    } catch (error) {
      console.error('Project recommendation failed:', error);
      return [];
    }
  }
  
  async generateBlogContent(topic, outline) {
    try {
      const prompt = `You are a technical blog writer. Create engaging, informative content with code examples where appropriate.
      Write a blog post about "${topic}" with this outline: ${outline}`;
      
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Blog generation failed:', error);
      throw error;
    }
  }
  
  async generateSEOTags(title, content) {
    try {
      const prompt = `Generate SEO-optimized meta title, description, and keywords for the given content. Return as JSON with keys: title, description, keywords.
      Title: ${title}
      Content: ${content.substring(0, 500)}...`;
      
      const result = await this.model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (error) {
      console.error('SEO generation failed:', error);
      return {
        title: title,
        description: content.substring(0, 160),
        keywords: []
      };
    }
  }
}

module.exports = new AIService();