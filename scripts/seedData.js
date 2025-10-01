const { 
  User, 
  Project, 
  Blog, 
  Skill, 
  Achievement, 
  Testimonial 
} = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      email: 'admin@saandeep.dev',
      password: hashedPassword,
      role: 'admin'
    });

    // Seed Skills
    const skills = [
      { name: 'JavaScript', level: 90, category: 'Frontend', icon: 'js', order: 1 },
      { name: 'React', level: 85, category: 'Frontend', icon: 'react', order: 2 },
      { name: 'Next.js', level: 80, category: 'Frontend', icon: 'nextjs', order: 3 },
      { name: 'Node.js', level: 85, category: 'Backend', icon: 'nodejs', order: 4 },
      { name: 'Python', level: 88, category: 'Backend', icon: 'python', order: 5 },
      { name: 'Firebase', level: 75, category: 'Database', icon: 'firebase', order: 6 },
      { name: 'AWS', level: 75, category: 'Cloud', icon: 'aws', order: 7 },
      { name: 'Machine Learning', level: 80, category: 'AI/ML', icon: 'ml', order: 8 }
    ];
    
    for (const skill of skills) {
      await Skill.create(skill);
    }

    // Seed Projects
    const projects = [
      {
        title: 'Item Retriever',
        description: 'A comprehensive lost and found application built with React and Firebase.',
        technologies: ['React', 'Firebase', 'JavaScript', 'CSS3'],
        images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'],
        liveUrl: 'https://item-retriever.vercel.app',
        githubUrl: 'https://github.com/saandeep/item-retriever',
        featured: true,
        clicks: 45
      },
      {
        title: 'Face Locker',
        description: 'Advanced facial recognition authentication system using face-api.js.',
        technologies: ['React', 'face-api.js', 'JavaScript', 'WebRTC'],
        images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop'],
        liveUrl: 'https://face-locker.vercel.app',
        githubUrl: 'https://github.com/saandeep/face-locker',
        featured: true,
        clicks: 32
      }
    ];
    
    for (const project of projects) {
      await Project.create(project);
    }

    // Seed Achievements
    const achievements = [
      {
        title: 'Hackathon Winner - TechFest 2023',
        description: 'Won first place in the AI/ML category.',
        date: new Date('2023-10-15'),
        type: 'hackathon',
        image: 'https://images.unsplash.com/photo-1559223607-b4d0555ae227?w=400&h=300&fit=crop'
      }
    ];
    
    for (const achievement of achievements) {
      await Achievement.create(achievement);
    }

    // Seed Blog Posts
    const blogs = [
      {
        title: 'Building Scalable Web Applications with Next.js',
        content: 'Next.js has revolutionized React development...',
        excerpt: 'Explore how Next.js revolutionizes React development.',
        slug: 'building-scalable-web-applications-with-nextjs',
        tags: ['Next.js', 'React', 'Web Development'],
        category: 'Web Development',
        published: true,
        views: 234,
        likes: 18
      }
    ];
    
    for (const blog of blogs) {
      await Blog.create(blog);
    }

    // Seed Testimonials
    const testimonials = [
      {
        name: 'Sarah Johnson',
        position: 'Senior Developer',
        company: 'TechCorp Inc.',
        message: 'Saandeep delivered exceptional work on our project.',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        rating: 5,
        approved: true
      }
    ];
    
    for (const testimonial of testimonials) {
      await Testimonial.create(testimonial);
    }

    console.log('✅ Database seeded successfully!');
    console.log('📊 Seeded data:');
    console.log(`   - 1 Admin user (admin@saandeep.dev / admin123)`);
    console.log(`   - ${skills.length} Skills`);
    console.log(`   - ${projects.length} Projects`);
    console.log(`   - ${achievements.length} Achievements`);
    console.log(`   - ${blogs.length} Blog posts`);
    console.log(`   - ${testimonials.length} Testimonials`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
};

seedData();