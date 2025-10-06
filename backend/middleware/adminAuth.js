const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    // Assumes req.userId is set by regular auth middleware
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin privileges'
    });
  }
};

module.exports = adminAuth;
