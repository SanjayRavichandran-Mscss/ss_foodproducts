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

// New cart-related functions
exports.addToCart = async (req, res) => {
  const { customerId, productId, quantity } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO cart_items (customer_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)",
      [customerId, productId, quantity]
    );
    res.status(200).json({ message: "Added to cart", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Failed to add to cart" });
  }
};

exports.getCart = async (req, res) => {
  const { customerId } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT ci.*, p.name AS product_name, p.price 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.customer_id = ?`,
      [customerId]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

exports.updateCartQuantity = async (req, res) => {
  const { customerId, productId, quantity } = req.body;
  try {
    await db.query(
      "UPDATE cart_items SET quantity = ? WHERE customer_id = ? AND product_id = ?",
      [quantity, customerId, productId]
    );
    res.status(200).json({ message: "Quantity updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update quantity" });
  }
};



exports.deleteFromCart = async (req, res) => {
  const { customerId, productId } = req.query;

  // Validate required parameters
  if (!customerId || !productId) {
    return res.status(400).json({ error: 'customerId and productId are required' });
  }

  try {
    // Log raw input for debugging
    console.log('Delete request received:', { rawCustomerId: customerId, rawProductId: productId });

    // Validate and convert customerId to integer
    const decodedCustomerId = parseInt(customerId, 10);
    if (isNaN(decodedCustomerId)) {
      return res.status(400).json({ error: 'Invalid customerId format' });
    }

    // Validate and convert productId to integer
    const decodedProductId = parseInt(productId, 10);
    if (isNaN(decodedProductId)) {
      return res.status(400).json({ error: 'Invalid productId format' });
    }

    // SQL query to delete cart item from cart_items table with MySQL placeholders
    const query = 'DELETE FROM cart_items WHERE customer_id = ? AND product_id = ?';
    const values = [decodedCustomerId, decodedProductId];
    console.log('Executing query:', { query, values }); // Log query for debugging
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    console.log('Item deleted successfully:', { customerId: decodedCustomerId, productId: decodedProductId });
    res.status(200).json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing item from cart:', {
      message: error.message,
      stack: error.stack,
      queryContext: error.sql || 'No query context available',
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};




exports.getWishlist = async (req, res) => {
  const { customerId } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT * FROM wishlist WHERE customer_id = ?`,
      [customerId]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
};

exports.toggleWishlist = async (req, res) => {
  const { customerId, productId } = req.body;
  if (!customerId || !productId) {
    return res.status(400).json({ error: 'customerId and productId are required' });
  }
  try {
    const [existing] = await db.query(
      'SELECT * FROM wishlist WHERE customer_id = ? AND product_id = ?',
      [customerId, productId]
    );
    let is_liked;
    if (existing.length > 0) {
      is_liked = existing[0].is_liked === 1 ? 0 : 1;
      await db.query(
        'UPDATE wishlist SET is_liked = ?, updated_at = NOW() WHERE customer_id = ? AND product_id = ?',
        [is_liked, customerId, productId]
      );
    } else {
      is_liked = 1;
      await db.query(
        'INSERT INTO wishlist (customer_id, product_id, is_liked, added_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [customerId, productId, is_liked]
      );
    }
    res.status(200).json({ message: is_liked === 1 ? 'Added to wishlist' : 'Removed from wishlist', is_liked });
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};