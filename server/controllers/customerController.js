const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const SESSIONS = new Map(); // Store active sessions

exports.register = async (req, res) => {
  const { username, email, password, full_name, phone } = req.body;

  // Input validation
  if (!username || username.length > 50) {
    return res.status(400).json({ message: 'Username is required and must be 50 characters or less' });
  }
  if (!email || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Valid email is required and must be 100 characters or less' });
  }
  if (!password || password.length > 255 || password.length < 6) {
    return res.status(400).json({ message: 'Password is required, must be 6-255 characters' });
  }
  if (!full_name || full_name.length > 100) {
    return res.status(400).json({ message: 'Full name is required and must be 100 characters or less' });
  }
  if (!phone || phone.length > 20 || !/^\+?[\d\s-]{7,20}$/.test(phone)) {
    return res.status(400).json({ message: 'Valid phone number is required and must be 20 characters or less' });
  }

  try {
    // Check if user exists
    const [existingUser] = await db.query('SELECT * FROM customers WHERE email = ? OR username = ?', [email, username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new customer
    const [result] = await db.query(
      'INSERT INTO customers (username, email, password, full_name, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [username, email, hashedPassword, full_name, phone]
    );

    if (result.affectedRows === 0) {
      console.error('Database insert failed: No rows affected');
      return res.status(500).json({ message: 'Failed to register user' });
    }

    console.log(`User registered successfully: ${email}, ID: ${result.insertId}`);
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(500).json({ message: 'Database access denied. Check database credentials.' });
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};
exports.login = async (req, res) => {
  const { login, password } = req.body; // Changed from email to login to reflect username or email input

  try {
    // Check if user exists by username or email
    const [users] = await db.query(
      'SELECT * FROM customers WHERE username = ? OR email = ?',
      [login, login]
    );
    
    if (users.length === 0) {
      console.error('Login failed: No user found with username or email:', login);
      return res.status(401).json({ message: 'Invalid username or email' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.error('Login failed: Invalid password for user:', user.id);
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Check for existing session
    if (SESSIONS.has(user.id)) {
      console.log(`Existing session found for user ${user.id}, invalidating previous session`);
      SESSIONS.delete(user.id);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    // Store new session
    SESSIONS.set(user.id, token);

    console.log(`Login successful for user ${user.id}, token generated`);
    res.status(200).json({
      message: 'Login successful',
      token,
      customerId: user.id
    });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getProfile = async (req, res) => {
  const authHeader = req.headers.authorization;
  const customerId = req.query.customerId;

  // Check for token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  // Check for customerId
  if (!customerId || isNaN(customerId)) {
    return res.status(400).json({ message: 'Invalid customer ID' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Ensure the token's customer ID matches the provided customerId
    if (decoded.id !== parseInt(customerId)) {
      return res.status(401).json({ message: 'Unauthorized: Token does not match customer ID' });
    }

    // Fetch user data from customers table
    const [users] = await db.query('SELECT full_name, email FROM customers WHERE id = ?', [customerId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      full_name: users[0].full_name,
      email: users[0].email,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};