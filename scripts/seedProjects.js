const { Project } = require('../models');

const projects = [
  {
    title: "Item Retriever",
    category: "fullstack",
    type: "Lost & Found Tool",
    description: "React + Firebase app with image upload, location tagging, and real-time listing for lost and found items.",
    technologies: ["React", "Firebase", "JavaScript"],
    liveUrl: "https://item-retriever.vercel.app",
    githubUrl: "#",
    image: "/images/ItemRetriever.png",
    featured: true
  },
  {
    title: "Face Locker",
    category: "ai",
    type: "Facial Recognition",
    description: "Built facial recognition login using face-api.js and React. Secure authentication system deployed on Vercel.",
    technologies: ["React", "face-api.js", "JavaScript"],
    liveUrl: "https://face-locker.vercel.app",
    githubUrl: "#",
    image: "/images/5050f77a1c42ee26cfb7168b74a7994c.jpg",
    featured: true
  },
  {
    title: "Voice Clone",
    category: "ai",
    type: "Voice Synthesis",
    description: "Advanced voice cloning using Coqui TTS with deep learning models to replicate human voice using short audio samples.",
    technologies: ["Python", "Coqui TTS", "Deep Learning", "AI"],
    liveUrl: "#",
    githubUrl: "#",
    image: "/images/VoiceClone.png",
    featured: true
  },
  {
    title: "Educational Video Generator",
    category: "ai",
    type: "AI Learning System",
    description: "AI-powered system combining TTS, narration sync, and Manim animations to auto-generate learning videos.",
    technologies: ["Python", "Manim", "TTS", "AI"],
    liveUrl: "#",
    githubUrl: "#",
    image: "/images/EducationalVideoGen.png",
    featured: true
  },
  {
    title: "AudioBook Generator",
    category: "ai",
    type: "TTS Application",
    description: "Created an audiobook generator with TTS, emotional intonation, and pause control for natural narration.",
    technologies: ["Python", "TTS", "Audio Processing"],
    liveUrl: "#",
    githubUrl: "#",
    image: "/images/AudiobookGen.png",
    featured: false
  },
  {
    title: "VisionTalk",
    category: "ai",
    type: "Multi-AI Tool",
    description: "Multi-feature AI tool: live image recognition, image-to-music, image-based storytelling, and integrated voice cloning.",
    technologies: ["Python", "Computer Vision", "TTS", "AI"],
    liveUrl: "#",
    githubUrl: "#",
    image: "/images/VisionTalk.png",
    featured: true
  },
  {
    title: "Tune Genie",
    category: "ai",
    type: "AI Music Generator",
    description: "AI music generator producing authentic Indian traditional tunes based on user-provided scenes, with multiple samples.",
    technologies: ["Python", "AI", "Music Generation"],
    liveUrl: "#",
    githubUrl: "#",
    image: "/images/TuneGenie.png",
    featured: false
  },
  {
    title: "Personalized AI Tutor",
    category: "ai",
    type: "Educational AI",
    description: "Adaptive AI tutor that restructures course modules based on user performance for personalized learning.",
    technologies: ["Python", "Machine Learning", "AI"],
    liveUrl: "#",
    githubUrl: "#",
    image: "/images/PersonalizedAITutor.png",
    featured: false
  },
  {
    title: "Music Management Application",
    category: "python",
    type: "CLI Application",
    description: "CLI-based app to manage music data (add, remove, modify songs) with playlist-like functionality.",
    technologies: ["Python", "CLI", "Data Management"],
    liveUrl: "#",
    githubUrl: "#",
    image: "/images/MusicManagement.png",
    featured: false
  },
  {
    title: "Titanic Data Analysis",
    category: "python",
    type: "Data Science",
    description: "Explored Titanic dataset, analyzing survival patterns by gender, age, and ticket class using Pandas, NumPy, and Seaborn.",
    technologies: ["Python", "Pandas", "NumPy", "Seaborn"],
    liveUrl: "#",
    githubUrl: "#",
    image: "/images/Titianic.png",
    featured: false
  },
  {
    title: "AWS Static Website",
    category: "cloud",
    type: "Cloud Deployment",
    description: "Deployed static site using AWS S3 and EC2, configured policies, and monitored with CloudWatch.",
    technologies: ["AWS", "S3", "EC2", "CloudWatch"],
    liveUrl: "#",
    githubUrl: "#",
    image: "/images/AWS.png",
    featured: false
  }
];

async function seedProjects() {
  try {
    console.log('Starting to seed projects...');
    
    for (const projectData of projects) {
      await Project.create(projectData);
      console.log(`Created project: ${projectData.title}`);
    }
    
    console.log('Projects seeded successfully!');
  } catch (error) {
    console.error('Error seeding projects:', error);
  }
}

if (require.main === module) {
  seedProjects();
}

module.exports = { seedProjects };