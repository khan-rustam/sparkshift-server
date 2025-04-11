import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Email configuration with improved reliability
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST_SMTP,
  port: process.env.EMAIL_PORT_SMTP,
  secure: true,
  auth: {
    user: process.env.EMAIL_ADMIN,
    pass: process.env.EMAIL_PASS,
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
  debug: true,
  logger: true
});

// Verify SMTP connection
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("Server is ready to take messages");
  }
});

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

// Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Sparkshift" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset OTP - Sparkshift',
    html: `
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 40px 20px; min-height: 100vh; margin: 0; font-family: Arial, sans-serif;">
        <div style="background-color: #242424; max-width: 600px; margin: 0 auto; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src='https://sparkshift.digital/assets/logo-Dop5KKen.png' alt="Sparkshift" style="height: 60px; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(130, 87, 229, 0.3));">
          </div>
          <div style="background-color: #2d2d2d; padding: 30px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #3d3d3d;">
            <h2 style="color: #9333ea; margin-top: 0; margin-bottom: 20px; font-size: 24px; text-align: center;">Password Reset OTP</h2>
            <p style="color: #ffffff; line-height: 1.6; margin-bottom: 25px; text-align: center;">
              You have requested to reset your password. Use the following OTP to proceed:
            </p>
            <div style="background-color: #1a1a1a; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; border: 1px solid #3d3d3d;">
              <h1 style="color: #9333ea; margin: 0; font-size: 36px; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
            </div>
            <p style="color: #ffffff; line-height: 1.6; margin-bottom: 25px; text-align: center;">
              This OTP will expire in 10 minutes.
            </p>
            <p style="color: #a0a0a0; font-size: 14px; margin-top: 25px; text-align: center;">
              If you didn't request this password reset, please ignore this email.
            </p>
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
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};

// Send OTP email for registration
const sendRegistrationOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Sparkshift" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Email Verification OTP - Sparkshift',
    html: `
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 40px 20px; min-height: 100vh; margin: 0; font-family: Arial, sans-serif;">
        <div style="background-color: #242424; max-width: 600px; margin: 0 auto; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src='https://sparkshift.digital/assets/logo-Dop5KKen.png' alt="Sparkshift" style="height: 60px; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(130, 87, 229, 0.3));">
          </div>
          <div style="background-color: #2d2d2d; padding: 30px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #3d3d3d;">
            <h2 style="color: #9333ea; margin-top: 0; margin-bottom: 20px; font-size: 24px; text-align: center;">Email Verification Code</h2>
            <p style="color: #ffffff; line-height: 1.6; margin-bottom: 25px; text-align: center;">
              Thank you for signing up with Sparkshift. To complete your registration, please use the following verification code:
            </p>
            <div style="background-color: #1a1a1a; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; border: 1px solid #3d3d3d;">
              <h1 style="color: #9333ea; margin: 0; font-size: 36px; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
            </div>
            <p style="color: #ffffff; line-height: 1.6; margin-bottom: 25px; text-align: center;">
              This verification code will expire in 10 minutes.
            </p>
            <p style="color: #a0a0a0; font-size: 14px; margin-top: 25px; text-align: center;">
              If you didn't request to create an account with Sparkshift, please ignore this email.
            </p>
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
    const info = await transporter.sendMail(mailOptions);
    console.log("Registration OTP email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending registration OTP email:", error);
    throw error;
  }
};

// Send Registration OTP
router.post('/send-registration-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiry time (10 minutes)
    otpStore.set(`register:${email}`, {
      otp,
      timestamp: Date.now(),
      attempts: 0,
      expiresAt: Date.now() + 600000 // 10 minutes
    });
    
    // Send OTP email
    await sendRegistrationOTPEmail(email, otp);
    
    res.status(200).json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Send Registration OTP error:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', { ...req.body, password: '[REDACTED]' });
    
    const { name, email, password, otp } = req.body;

    // Validate required fields
    if (!email || !password || !otp) {
      console.log("Missing required fields:", {
        email: !!email,
        password: !!password,
        otp: !!otp
      });
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Verify OTP
    const otpData = otpStore.get(`register:${email}`);
    if (!otpData) {
      return res.status(400).json({ message: 'No verification code found. Please request a new code.' });
    }
    
    if (otpData.otp !== otp) {
      // Increment failed attempts
      otpData.attempts += 1;
      otpStore.set(`register:${email}`, otpData);
      
      // If too many attempts, invalidate the OTP
      if (otpData.attempts >= 3) {
        otpStore.delete(`register:${email}`);
        return res.status(400).json({ message: 'Too many failed attempts. Please request a new code.' });
      }
      
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Check if OTP has expired
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(`register:${email}`);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }
    
    // OTP verified, create new user
    console.log('Creating new user with verified email...');
    user = new User({
      name: name || email.split('@')[0],
      email,
      password
    });

    await user.save();
    console.log('User saved successfully:', user._id);
    
    // Remove OTP from store
    otpStore.delete(`register:${email}`);

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name || email.split('@')[0],
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name || email.split('@')[0],
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message 
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching profile',
      error: error.message 
    });
  }
});

// Reset Password Request
router.post('/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error('Reset password request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {

  console.log(
    process.env.EMAIL_USER,
    process.env.EMAIL_PASSWORD,
    process.env.EMAIL_HOST_SMTP,
    process.env.EMAIL_PORT_SMTP,
    process.env.EMAIL_HOST_IMAP,
    process.env.EMAIL_PORT_IMAP,
    process.env.EMAIL_USER,
    process.env.EMAIL_PASSWORD
  );
  

  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      timestamp: Date.now(),
      attempts: 0,
    });

    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ message: 'No OTP request found' });
    }

    // Check if OTP has expired (10 minutes)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Check if too many attempts
    if (storedData.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Too many failed attempts' });
    }

    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP is valid, generate a temporary token for password reset
    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    otpStore.delete(email);
    res.json({ resetToken });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

export default router; 