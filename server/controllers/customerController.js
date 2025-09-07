const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const url = require('url');

const SESSIONS = new Map(); // Store active sessions

// Helper function to decode customerId from base64
function getDecodedCustomerId(req) {
  const customerIdBase64 = req.query.customerId;
  if (!customerIdBase64) {
    return null;
  }
  
  try {
    // First try to decode as base64
    try {
      const customerId = parseInt(Buffer.from(customerIdBase64, 'base64').toString('utf-8'), 10);
      if (!isNaN(customerId)) {
        return customerId;
      }
    } catch (base64Error) {
      console.log('Not a base64 encoded ID, trying raw value');
    }
    
    // If base64 decoding fails, try to parse as raw integer
    const customerId = parseInt(customerIdBase64, 10);
    return isNaN(customerId) ? null : customerId;
  } catch (error) {
    console.error('Error decoding customerId:', error);
    return null;
  }
}

// Helper function to check if customer exists
async function checkCustomerExists(customerId) {
  try {
    const [rows] = await db.query('SELECT id FROM customers WHERE id = ?', [customerId]);
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking customer existence:', error);
    return false;
  }
}

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
      `SELECT ci.*, p.name AS product_name, p.price, p.thumbnail_url, p.stock_quantity 
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

// Address management methods
exports.getAddresses = async (req, res) => {
  const customerId = getDecodedCustomerId(req);

  if (!customerId || isNaN(customerId)) {
    return res.status(400).json({ message: 'Invalid customer ID' });
  }

  try {
    // Check if customer exists
    if (!(await checkCustomerExists(customerId))) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const [rows] = await db.query(
      'SELECT id, street, city, state, zip_code, country, is_default FROM addresses WHERE customer_id = ?',
      [customerId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

exports.addAddress = async (req, res) => {
  const customerId = getDecodedCustomerId(req);
  if (!customerId) {
    return res.status(400).json({ message: 'Customer ID is required' });
  }

  const { street, city, state, zip_code, country, is_default } = req.body;

  // Input validation
  if (!street || street.length > 255) {
    return res.status(400).json({ message: 'Street is required and must be 255 characters or less' });
  }
  if (!city || city.length > 100) {
    return res.status(400).json({ message: 'City is required and must be 100 characters or less' });
  }
  if (!state || state.length > 100) {
    return res.status(400).json({ message: 'State is required and must be 100 characters or less' });
  }
  if (!zip_code || zip_code.length > 20) {
    return res.status(400).json({ message: 'Zip code is required and must be 20 characters or less' });
  }
  if (!country || country.length > 100) {
    return res.status(400).json({ message: 'Country is required and must be 100 characters or less' });
  }

  try {
    // Check if customer exists
    if (!(await checkCustomerExists(customerId))) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // If is_default is true, set all other addresses to non-default
    if (is_default === 1 || is_default === true) {
      await db.query('UPDATE addresses SET is_default = 0 WHERE customer_id = ?', [customerId]);
    }

    const [result] = await db.query(
      'INSERT INTO addresses (customer_id, street, city, state, zip_code, country, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [customerId, street, city, state, zip_code, country, is_default ? 1 : 0]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: 'Failed to add address' });
    }

    console.log(`Address added for customer ${customerId}, ID: ${result.insertId}`);
    res.status(201).json({ message: 'Address added successfully', id: result.insertId });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

exports.updateAddress = async (req, res) => {
  const customerId = getDecodedCustomerId(req);
  if (!customerId) {
    return res.status(400).json({ message: 'Customer ID is required' });
  }

  const { id, street, city, state, zip_code, country, is_default } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: 'Address ID is required' });
  }

  // Input validation
  if (!street || street.length > 255) {
    return res.status(400).json({ message: 'Street is required and must be 255 characters or less' });
  }
  if (!city || city.length > 100) {
    return res.status(400).json({ message: 'City is required and must be 100 characters or less' });
  }
  if (!state || state.length > 100) {
    return res.status(400).json({ message: 'State is required and must be 100 characters or less' });
  }
  if (!zip_code || zip_code.length > 20) {
    return res.status(400).json({ message: 'Zip code is required and must be 20 characters or less' });
  }
  if (!country || country.length > 100) {
    return res.status(400).json({ message: 'Country is required and must be 100 characters or less' });
  }

  try {
    // Check if customer exists
    if (!(await checkCustomerExists(customerId))) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if address exists and belongs to customer
    const [existing] = await db.query('SELECT * FROM addresses WHERE id = ? AND customer_id = ?', [id, customerId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If is_default is true, set all other addresses to non-default
    if (is_default === 1 || is_default === true) {
      await db.query('UPDATE addresses SET is_default = 0 WHERE customer_id = ? AND id != ?', [customerId, id]);
    }

    const [result] = await db.query(
      'UPDATE addresses SET street = ?, city = ?, state = ?, zip_code = ?, country = ?, is_default = ?, updated_at = NOW() WHERE id = ? AND customer_id = ?',
      [street, city, state, zip_code, country, is_default ? 1 : 0, id, customerId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: 'Failed to update address' });
    }

    console.log(`Address updated: ID ${id} for customer ${customerId}`);
    res.status(200).json({ message: 'Address updated successfully' });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  const customerId = getDecodedCustomerId(req);
  if (!customerId) {
    return res.status(400).json({ message: 'Customer ID is required' });
  }

  const parsedUrl = url.parse(req.url, true);
  const id = parseInt(parsedUrl.query.id, 10);

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: 'Address ID is required' });
  }

  try {
    // Check if customer exists
    if (!(await checkCustomerExists(customerId))) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const [result] = await db.query('DELETE FROM addresses WHERE id = ? AND customer_id = ?', [id, customerId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    console.log(`Address deleted: ID ${id} for customer ${customerId}`);
    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

exports.getCustomerDetails = async (req, res) => {
  const customerId = getDecodedCustomerId(req);

  if (!customerId || isNaN(customerId)) {
    return res.status(400).json({ message: 'Invalid customer ID' });
  }

  try {
    const [rows] = await db.query(
      'SELECT full_name, phone FROM customers WHERE id = ?',
      [customerId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Get customer details error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};



exports.placeOrder = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const { customerId: customerIdStr, addressId, paymentMethodId, orderMethod, items, totalAmount } = req.body;
    const customerId = parseInt(customerIdStr, 10);

    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    if (decoded.id !== customerId) {
      return res.status(401).json({ message: 'Unauthorized: Token does not match customer ID' });
    }

    if (!addressId || !paymentMethodId || !orderMethod || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const orderMethodId = orderMethod === 'buy_now' ? 1 : orderMethod === 'cart' ? 2 : null;
    if (!orderMethodId) {
      return res.status(400).json({ message: 'Invalid order method' });
    }

    // Validate items
    let calculatedTotal = 0;
    let orderItemsValues = [];
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.price || isNaN(item.quantity) || isNaN(item.price)) {
        return res.status(400).json({ message: 'Invalid item data: product_id, quantity, and price are required' });
      }
      const qty = parseInt(item.quantity, 10);
      const price = parseFloat(item.price);
      if (qty <= 0 || price < 0) {
        return res.status(400).json({ message: 'Invalid quantity or price' });
      }
      const priceAtPurchase = price * qty;
      calculatedTotal += priceAtPurchase;
      orderItemsValues.push([null, item.product_id, qty, priceAtPurchase, priceAtPurchase]);
    }

    // Verify totalAmount
    if (totalAmount && Math.abs(parseFloat(totalAmount) - calculatedTotal) > 0.01) {
      return res.status(400).json({ message: 'Total amount mismatch' });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [orderResult] = await connection.query(
        'INSERT INTO orders (customer_id, address_id, order_date, order_status_id, total_amount, payment_method_id, tracking_number, updated_at, order_method_id) VALUES (?, ?, NOW(), 1, ?, ?, NULL, NOW(), ?)',
        [customerId, addressId, calculatedTotal, paymentMethodId, orderMethodId]
      );

      const orderId = orderResult.insertId;

      // Update orderItemsValues with orderId
      orderItemsValues = orderItemsValues.map(row => [orderId, ...row.slice(1)]);

      if (orderItemsValues.length > 0) {
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, subtotal) VALUES ?',
          [orderItemsValues]
        );
      }

      if (orderMethodId === 2) {
        await connection.query('DELETE FROM cart_items WHERE customer_id = ?', [customerId]);
      }

      await connection.commit();

      res.status(201).json({ message: 'Order placed successfully', orderId });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Place order error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

exports.getOrders = async (req, res) => {
  const customerId = req.query.customerId;

  if (!customerId || isNaN(customerId)) {
    return res.status(400).json({ message: 'Invalid or missing customer ID' });
  }

  const parsedCustomerId = parseInt(customerId, 10);

  try {
    // Check if customer exists
    const [customerExists] = await db.query('SELECT id FROM customers WHERE id = ?', [parsedCustomerId]);
    if (customerExists.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const ordersQuery = `
      SELECT o.id AS order_id, o.customer_id, o.address_id, o.order_date, o.order_status_id, 
             o.total_amount, o.payment_method_id, o.tracking_number, o.updated_at, o.order_method_id,
             a.street, a.city, a.state, a.zip_code, a.country,
             os.status AS order_status,
             pm.method AS payment_method,
             om.method AS order_method
      FROM orders o
      JOIN addresses a ON o.address_id = a.id
      JOIN order_status os ON o.order_status_id = os.id
      JOIN payment_methods pm ON o.payment_method_id = pm.id
      JOIN order_methods om ON o.order_method_id = om.id
      WHERE o.customer_id = ?
      ORDER BY o.order_date DESC
    `;
    const [orders] = await db.query(ordersQuery, [parsedCustomerId]);

    const itemsQuery = `
      SELECT oi.order_id, oi.product_id, oi.quantity, oi.price_at_purchase, oi.subtotal,
             p.name, p.description, p.thumbnail_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.customer_id = ?
    `;
    const [itemsRows] = await db.query(itemsQuery, [parsedCustomerId]);

    const itemsMap = {};
    for (const row of itemsRows) {
      const orderId = row.order_id;
      if (!itemsMap[orderId]) {
        itemsMap[orderId] = [];
      }
      itemsMap[orderId].push({
        product_id: row.product_id,
        quantity: row.quantity,
        price_at_purchase: row.price_at_purchase,
        subtotal: row.subtotal,
        name: row.name,
        description: row.description,
        thumbnail_url: row.thumbnail_url
      });
    }

    for (let order of orders) {
      order.items = itemsMap[order.order_id] || [];
      order.address = {
        street: order.street,
        city: order.city,
        state: order.state,
        zip_code: order.zip_code,
        country: order.country
      };
      delete order.street;
      delete order.city;
      delete order.state;
      delete order.zip_code;
      delete order.country;
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};