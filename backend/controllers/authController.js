// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Generate JWT token
const generateToken = (detailer) => {
  return jwt.sign(
    { 
      detailerId: detailer.id, 
      email: detailer.email, 
      name: detailer.name 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Login detailer
const loginDetailer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find detailer by email
    const detailer = await prisma.detailer.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!detailer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if detailer is active
    if (!detailer.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Please contact admin.'
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, detailer.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(detailer);

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      detailer: {
        id: detailer.id,
        name: detailer.name,
        email: detailer.email,
        phone: detailer.phone
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Verify token and get detailer info
const verifyDetailer = async (req, res) => {
  try {
    const detailer = await prisma.detailer.findUnique({
      where: { id: req.detailer.detailerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true
      }
    });

    if (!detailer || !detailer.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account not found or disabled'
      });
    }

    res.json({
      success: true,
      detailer
    });

  } catch (error) {
    console.error('Verify detailer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};

module.exports = {
  loginDetailer,
  verifyDetailer
};