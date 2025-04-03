# SparkShift Backend 🚀

<div align="center">
  <img src="../Frontend/public/logo.png" alt="SparkShift Backend Logo" width="150"/>
  
  [![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.18.2-000000.svg)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248.svg)](https://www.mongodb.com/)
  [![JWT](https://img.shields.io/badge/JWT-Authentication-000000.svg)](https://jwt.io/)
</div>

## Overview

The SparkShift Backend is a Node.js server built with Express.js and MongoDB. It provides a robust API with secure authentication, file uploads, and real-time data handling.

## Directory Structure

```
server/
├── config/           # Configuration files
│   ├── db.js        # Database configuration
│   └── cloudinary.js # Cloud storage setup
├── routes/          # API routes
│   ├── auth.js      # Authentication routes
│   ├── users.js     # User management
│   └── ...         # Other route files
├── models/          # MongoDB models
│   ├── User.js      # User model
│   └── ...         # Other models
├── middleware/      # Custom middleware
│   ├── auth.js      # Authentication middleware
│   └── ...         # Other middleware
├── utils/          # Utility functions
├── .env            # Environment variables
└── server.js       # Main server file
```

## Features

- 🔒 JWT Authentication
- 📧 Email notifications
- ☁️ Cloud storage integration
- 🔄 Real-time updates
- 📝 File uploads
- 🛡️ Security middleware
- 📊 Data validation
- 🔍 Error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Email Service**: Nodemailer
- **Security**: bcryptjs
- **File Upload**: multer

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### File Upload
- `POST /api/upload` - Upload file
- `DELETE /api/upload/:id` - Delete file

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:5000`

### Production

Start the production server:
```bash
npm start
```

## Environment Variables

Required environment variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

## Security Features

- JWT Authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- XSS protection
- Helmet security headers

## Error Handling

The server implements a centralized error handling system:
- Custom error classes
- Error logging
- Client-friendly error messages
- HTTP status codes

## Database Models

### User Model
```javascript
{
  username: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Contributing

1. Create a new branch for your feature
2. Follow the coding standards
3. Add proper documentation
4. Test your changes
5. Submit a pull request

## Best Practices

- Use async/await for asynchronous operations
- Implement proper error handling
- Follow RESTful API conventions
- Use proper naming conventions
- Write clean and maintainable code
- Add comments where necessary
- Test your endpoints
- Implement proper logging 