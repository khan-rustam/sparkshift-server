import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import auth from "./middleware/auth.js";
import portfolioRoutes from './routes/portfolio.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const emailQueue = [];
let isProcessingQueue = false;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://sparkshift.digital', 
      'https://api.sparkshift.digital',
      'http://localhost:5173',
      'https://www.sparkshift.digital'
    ];
    
    // Allow requests with no origin (like mobile apps, curl requests, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('CORS blocked request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully🎯✅');
  } catch (err) {
    console.error('MongoDB connection error❌❌:', {
      name: err.name,
      message: err.message,
      code: err.code
    });
    process.exit(1);
  }
};

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Protected route example
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Email configuration with improved reliability
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST_SMTP,
  port: process.env.EMAIL_PORT_SMTP,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  rateDelta: 1000,
  rateLimit: 5,
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 45000,
  debug: process.env.NODE_ENV === 'development',
});

// Only verify connection in development
if (process.env.NODE_ENV === "development") {
  transporter.verify(function (error, success) {
    if (error) {
      console.error("SMTP connection error:", error);
    } else {
      console.log("Server is ready to take messages");
    }
  });
}

// Process email queue with retry logic
async function processEmailQueue() {
  if (isProcessingQueue || emailQueue.length === 0) return;

  isProcessingQueue = true;

  while (emailQueue.length > 0) {
    const mailOptions = emailQueue.shift();
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
        success = true;
      } catch (error) {
        retries--;
        console.error(`Email sending error (${retries} retries left):`, error);
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 2000));
        } else {
          console.error("Failed to send email after all retries:", error);
          if (mailOptions.to === process.env.EMAIL_ADMIN) {
            emailQueue.push(mailOptions);
          }
        }
      }
    }
  }

  isProcessingQueue = false;
}

// Increase the interval between queue processing attempts
setInterval(processEmailQueue, 1000);

// Contact form endpoint
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Email to admin
  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_ADMIN,
    subject: `${subject} - from ${name}`,
    html: `
     <div style="background-color: #1a1a1a; color: #ffffff; padding: 40px 20px; min-height: 100vh; margin: 0; font-family: Arial, sans-serif;">
        <div style="background-color: #242424; max-width: 600px; margin: 0 auto; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src='https://sparkshift.digital/assets/logo-Dop5KKen.png' alt="Sparkshift" style="height: 60px; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(130, 87, 229, 0.3));">
          </div>
          <div style="background-color: #2d2d2d; padding: 30px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #3d3d3d;">
            <h2 style="color: #9333ea; margin-top: 0; margin-bottom: 20px; font-size: 24px;">New Contact Form Submission</h2>

            <div style="margin-bottom: 20px">
              <div style="color: #9333ea; font-weight: bold; margin-bottom: 8px">
                Name
              </div>
              <div style="color: #ffffff; background-color: #1a1a1a; padding: 12px; border-radius: 8px; border: 1px solid #3d3d3d;">
                ${name}
              </div>
            </div>

            <div style="margin-bottom: 20px">
              <div style="color: #9333ea; font-weight: bold; margin-bottom: 8px">
                Email
              </div>
              <div style="color: #ffffff; background-color: #1a1a1a; padding: 12px; border-radius: 8px; border: 1px solid #3d3d3d;">
                ${email}
              </div>
            </div>

            <div style="margin-bottom: 20px">
              <div style="color: #9333ea; font-weight: bold; margin-bottom: 8px">
                Subject
              </div>
              <div style="color: #ffffff; background-color: #1a1a1a; padding: 12px; border-radius: 8px; border: 1px solid #3d3d3d;">
                ${subject}
              </div>
            </div>

            <div style="margin-bottom: 20px">
              <div style="color: #9333ea; font-weight: bold; margin-bottom: 8px">
                Message
              </div>
              <div style="color: #ffffff; background-color: #1a1a1a; padding: 12px; border-radius: 8px; border: 1px solid #3d3d3d; white-space: pre-wrap;">
                ${message}
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px">
              <a
                href="mailto:${email}?subject=Re: ${subject}"
                style="display: inline-block; background-color: #9333ea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 500; border: none;">
                Reply to Message
              </a>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
              Message received on ${new Date().toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p style="color: #a0a0a0; font-size: 12px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} Sparkshift. All rights reserved.
            </p>
          </div>
        </div>
      </div>`,
  };

  // Thank you email to user
  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Thank you for contacting Sparkshift`,
    html: `
    <div style="background-color: #1a1a1a; color: #ffffff; padding: 40px 20px; min-height: 100vh; margin: 0; font-family: Arial, sans-serif;">
      <div style="background-color: #242424; max-width: 600px; margin: 0 auto; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src='https://sparkshift.digital/assets/logo-Dop5KKen.png' alt="Sparkshift" style="height: 60px; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(130, 87, 229, 0.3));">
        </div>
        <div style="background-color: #2d2d2d; padding: 30px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #3d3d3d;">
          <h2 style="color: #9333ea; margin-top: 0; margin-bottom: 20px; font-size: 24px; text-align: center;">Thank You for Reaching Out!</h2>
          <p style="color: #ffffff; line-height: 1.6; margin-bottom: 20px;">
            Dear ${name},
          </p>
          <p style="color: #ffffff; line-height: 1.6; margin-bottom: 20px;">
            Thank you for contacting Sparkshift. We have received your message and our team will review it shortly. We appreciate your interest and will get back to you as soon as possible.
          </p>
          <p style="color: #ffffff; line-height: 1.6; margin-bottom: 25px;">
            Best regards,<br/>
            The Sparkshift Team
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://sparkshift.digital" 
               style="display: inline-block; 
                      background-color: #9333ea; 
                      color: #ffffff; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 8px;
                      font-weight: 500;
                      border: none;">
              Explore More
            </a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #a0a0a0; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Sparkshift. All rights reserved.
          </p>
        </div>
      </div>
    </div>
    `,
  };

  try {
    emailQueue.push(adminMailOptions);
    emailQueue.push(userMailOptions);
    res.status(200).json({ message: "Message received successfully" });
  } catch (error) {
    console.error("Error processing contact form:", error);
    res.status(500).json({ message: "Error processing your request" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} 🚀`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();