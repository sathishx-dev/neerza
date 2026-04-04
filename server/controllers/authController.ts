import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendOTPEmail } from '../services/emailService';
// import { io } from '../../server';
import { validationResult } from 'express-validator';
import { logSecurityEvent } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'neerza_secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'shivane2026@gmail.com';

export const sendOtp = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, mobile, address } = req.body;

  try {
    const db = await getDB();
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?::text', [email]);

    if (existingUser && existingUser.is_verified) {
      return res.status(400).json({ message: 'User already exists and is verified. Please login.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes 
    const otpExpiry = otpExpiryTime; 

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = email === ADMIN_EMAIL ? 'admin' : 'customer';

    if (existingUser && !existingUser.is_verified) {
      // Update unverified user with new OTP and details
      await db.run(
        'UPDATE users SET name = ?, password = ?, mobile = ?, address = ?, role = ?, otp = ?, otp_expiry = ? WHERE id = ?',
        [name, hashedPassword, mobile, address, role, otp, otpExpiry, existingUser.id]
      );
    } else {
      // Create new unverified user
      await db.run(
        'INSERT INTO users (name, email, password, mobile, address, role, otp, otp_expiry, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)',
        [name, email, hashedPassword, mobile, address, role, otp, otpExpiry]
      );
    }

    // Send OTP via email using existing reliable method
    await sendOTPEmail(email, name, otp);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, otp } = req.body;

  try {
    const db = await getDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?::text', [email]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const currentSQLDate = new Date();
    if (user.otp_expiry && new Date(user.otp_expiry) < currentSQLDate) {
       return res.status(400).json({ message: 'OTP has expired. Please register again to get a new one.' });
    }

    // Mark as verified and clear OTP fields natively on DB
    await db.run(
      'UPDATE users SET is_verified = TRUE, otp = NULL, otp_expiry = NULL WHERE id = ?',
      [user.id]
    );

    // Generate JWT token upon successful verification
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Emit live registration notification (Now handled by Supabase Realtime)
    /*
    if (io) {
       io.emit('new_customer', {
           message: 'New Customer Registered',
           customer: { id: user.id, name: user.name, email: user.email }
       });
    }
    */

    // Return token and user details to mimic login response
    res.status(201).json({ 
      message: 'User account created and verified successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const db = await getDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?::text', [email]);

    if (!user) {
       logSecurityEvent('FAILED_LOGIN_UNKNOWN_USER', { email });
       return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      return res.status(400).json({ message: 'Please verify your email first.' });
    }

    // Check for lockout
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.lockout_until).getTime() - Date.now()) / 60000);
      return res.status(403).json({ 
        message: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.` 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const attempts = (user.login_attempts || 0) + 1;
      let lockoutUpdate = '';
      let params = [attempts, user.id];
      
      if (attempts >= 5) {
        const lockoutTime = new Date(Date.now() + 15 * 60 * 1000);
        lockoutUpdate = ', lockout_until = ?';
        params = [attempts, lockoutTime, user.id];
        logSecurityEvent('ACCOUNT_LOCKOUT', { email, attempts });
      } else {
        logSecurityEvent('FAILED_LOGIN_ATTEMPT', { email, attempts });
      }

      await db.run(`UPDATE users SET login_attempts = ?${lockoutUpdate} WHERE id = ?`, params);
      
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Reset attempts on successful login
    await db.run('UPDATE users SET login_attempts = 0, lockout_until = NULL WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, mobile, address } = req.body;
  const userId = req.user?.id;

  try {
    const db = await getDB();
    await db.run(
      'UPDATE users SET name = ?, mobile = ?, address = ? WHERE id = ?',
      [name, mobile, address, userId]
    );

    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Emit live update to admin (Now handled by Supabase Realtime)
    /*
    if (io) {
       io.emit('user_update', {
          message: 'User Profile Updated',
          userId: updatedUser.id,
          name: updatedUser.name
       });
    }
    */

    res.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        role: updatedUser.role,
        address: updatedUser.address
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const db = await getDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?::text', [email]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'User is already verified. Please login.' });
    }

    // Generate new OTP and Expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const otpExpiry = otpExpiryTime;

    await db.run(
      'UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?',
      [otp, otpExpiry, user.id]
    );

    // Send new OTP via email
    await sendOTPEmail(user.email, user.name, otp);

    res.status(200).json({ message: 'A new OTP has been sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while resending OTP' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const db = await getDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?::text', [email]);

    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }

    // Generate OTP and Expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const otpExpiry = otpExpiryTime;

    await db.run(
      'UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?',
      [otp, otpExpiry, user.id]
    );

    // Send OTP via email
    await sendOTPEmail(user.email, user.name, otp);

    res.status(200).json({ message: 'OTP sent to your registered email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, otp, newPassword } = req.body;

  try {
    const db = await getDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?::text', [email]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const currentSQLDate = new Date();
    if (user.otp_expiry && new Date(user.otp_expiry) < currentSQLDate) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    await db.run(
      'UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.status(200).json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
