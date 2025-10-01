# 🚀 Portfolio Backend API

Express.js backend server for Saandeep's Portfolio website with Firebase integration.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js         # Database connection
│   └── firebase.js         # Firebase configuration
├── models/
│   └── index.js           # Firestore models
├── routes/
│   ├── projects.js        # Projects CRUD operations
│   ├── contact.js         # Contact form handling
│   └── analytics.js       # Analytics endpoints
├── middleware/
│   └── auth.js           # Authentication middleware
├── scripts/
│   └── seedProjects.js   # Database seeding script
├── services/
│   ├── aiService.js      # AI integration services
│   └── notifications.js  # Notification services
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── server.js            # Express server entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Firebase project
- Firebase service account key

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create `.env` file:
   ```env
   PORT=5000
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY_ID=your_private_key_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your_client_email
   FIREBASE_CLIENT_ID=your_client_id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   ```

3. **Seed Database**
   ```bash
   npm run seed
   ```

4. **Start Server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📊 API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project (admin)
- `PUT /api/projects/:id` - Update project (admin)
- `DELETE /api/projects/:id` - Delete project (admin)
- `POST /api/projects/:id/click` - Track project click

### Contact
- `POST /api/contact` - Submit contact form

### Analytics
- `POST /api/analytics/visit` - Track page visit
- `GET /api/analytics/stats` - Get analytics data (admin)

## 🔧 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample projects

## 🔒 Security Features

- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **Rate Limiting**: API request limiting
- **Input Validation**: Request data validation
- **Environment Variables**: Secure configuration

## 🚀 Deployment

### Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### Heroku
1. Create new app
2. Configure environment variables
3. Connect to GitHub
4. Enable automatic deploys

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details