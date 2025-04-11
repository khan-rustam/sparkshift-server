# SparkShift Backend 🚀

<div align="center">
  <img src="https://sparkshift.digital/assets/logo-Dop5KKen.png" alt="SparkShift Backend Logo" width="150"/>
  
  [![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.18.2-000000.svg)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248.svg)](https://www.mongodb.com/)
  [![JWT](https://img.shields.io/badge/JWT-Authentication-000000.svg)](https://jwt.io/)
</div>

## Overview

The SparkShift Backend is a Node.js server built with Express.js and MongoDB. It provides a robust API with secure authentication, file uploads, email services, and real-time data handling.

## Directory Structure

```
server/
├── routes/          # API routes
│   ├── auth.js      # Authentication routes
│   ├── portfolio.js # Portfolio management
│   └── ...         # Other route files
├── models/          # MongoDB models
│   ├── User.js      # User model
│   └── ...         # Other models
├── middleware/      # Custom middleware
│   ├── auth.js      # Authentication middleware
│   └── ...         # Other middleware
├── .env            # Environment variables
└── server.js       # Main server file
```

## Features

- 🔒 JWT Authentication
- 📧 Email services with queue system
- 📊 Password reset with OTP
- 🔄 Real-time updates
- 🛡️ Security middleware
- 📌 Contact form handling
- 🔍 Error handling
- ⚡ Portfolio management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Email Service**: Nodemailer
- **Security**: bcryptjs, CORS protection
- **Environment**: dotenv

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/verify-reset-otp` - Verify password reset OTP
- `POST /api/auth/reset-password` - Reset user password

### Portfolio
- `GET /api/portfolio` - Get portfolio items
- `POST /api/portfolio` - Create portfolio item
- `PUT /api/portfolio/:id` - Update portfolio item
- `DELETE /api/portfolio/:id` - Delete portfolio item

### Contact
- `POST /api/contact` - Submit contact form

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

The server will be available at `http://localhost:4000`

### Production

Start the production server:
```bash
npm start
```

## Environment Variables

Required environment variables:
```env
PORT=4000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

EMAIL_ADMIN=admin_email@example.com
EMAIL_USER=smtp_user@example.com
EMAIL_PASSWORD=smtp_password
EMAIL_HOST_SMTP=smtp.example.com
EMAIL_PORT_SMTP=465
EMAIL_HOST_IMAP=imap.example.com
EMAIL_PORT_IMAP=993
```

## Email Configuration

The server uses Nodemailer with the following features:
- Email queue system with retry logic
- Separate transporter instances for auth and general email
- Increased connection timeouts for reliability
- TLS security with minimum version TLSv1.2
- Connection pooling for better performance

## Security Features

- JWT Authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- Secure email transmission

## Error Handling

The server implements a robust error handling system:
- Custom error logging
- Client-friendly error messages
- HTTP status codes
- Email sending retry mechanism

## Database Models

### User Model
```javascript
{
  email: String,
  password: String,
  role: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
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