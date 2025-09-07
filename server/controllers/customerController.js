const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const url = require('url');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');

const SESSIONS = new Map(); // Store active sessions

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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

// Helper function to generate invoice data
async function generateInvoiceData(orderId) {
  try {
    // Fetch order details
    const orderQuery = `
      SELECT 
        o.id AS order_id,
        o.customer_id,
        o.order_date,
        o.total_amount,
        o.tracking_number,
        c.full_name as customer_name,
        c.email as customer_email,
        c.phone as customer_mobile,
        CONCAT(a.street, ', ', a.city, ', ', a.state, ' ', a.zip_code, ', ', a.country) as delivery_address,
        pm.method as payment_method,
        os.status as order_status,
        om.method as order_method
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN addresses a ON o.address_id = a.id
      JOIN payment_methods pm ON o.payment_method_id = pm.id
      JOIN order_status os ON o.order_status_id = os.id
      JOIN order_methods om ON o.order_method_id = om.id
      WHERE o.id = ?
    `;
    
    const [orderRows] = await db.execute(orderQuery, [orderId]);
    
    if (orderRows.length === 0) {
      throw new Error('Order not found');
    }
    
    const order = orderRows[0];
    
    // Fetch order items
    const itemsQuery = `
      SELECT 
        oi.product_id,
        oi.quantity,
        oi.price_at_purchase,
        oi.subtotal,
        p.name,
        p.thumbnail_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    
    const [itemRows] = await db.execute(itemsQuery, [orderId]);
    
    // Calculate totals
    const subtotal = parseFloat(order.total_amount);
    const shipping = subtotal > 999 ? 0 : 100;
    const tax = (subtotal * 0.18); // 18% GST
    const totalAmount = subtotal + shipping + tax;
    
    // Prepare template data
    const templateData = {
      baseUrl: process.env.BASE_URL || 'http://localhost:5000',
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerMobile: order.customer_mobile,
      deliveryAddress: order.delivery_address,
      orderId: order.order_id,
      invoiceDate: new Date().toLocaleDateString('en-IN'),
      orderDate: new Date(order.order_date).toLocaleDateString('en-IN'),
      paymentMethod: order.payment_method,
      orderStatus: order.order_status,
      orderMethod: order.order_method,
      items: itemRows.map(item => ({
        ...item,
        unitPrice: parseFloat(item.price_at_purchase / item.quantity).toFixed(2),
        subtotal: parseFloat(item.subtotal).toFixed(2)
      })),
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      freeShipping: shipping === 0,
      tax: tax.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      paymentStatus: 'Completed',
      trackingNumber: order.tracking_number || null
    };
    
    return { templateData, order };
  } catch (error) {
    console.error('Error generating invoice data:', error);
    throw error;
  }
}

// Helper function to generate PDF using PDFKit
async function generatePDFFromHTML(templateData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Add logo or header
      doc.fontSize(20).text('Suyambu Stores', 50, 50);
      doc.fontSize(10).text('Invoice', 50, 80);
      doc.moveDown();
      
      // Draw a line
      doc.moveTo(50, 100).lineTo(550, 100).stroke();
      doc.moveDown();
      
      // Invoice details
      doc.fontSize(12);
      doc.text(`Invoice Number: INV-${templateData.orderId}`, 50, 120);
      doc.text(`Invoice Date: ${templateData.invoiceDate}`, 300, 120);
      doc.text(`Order Date: ${templateData.orderDate}`, 50, 140);
      doc.text(`Order ID: ${templateData.orderId}`, 300, 140);
      doc.moveDown();
      
      // Customer information
      doc.text(`Customer: ${templateData.customerName}`, 50, 180);
      doc.text(`Email: ${templateData.customerEmail}`, 50, 200);
      doc.text(`Phone: ${templateData.customerMobile}`, 50, 220);
      doc.text(`Delivery Address: ${templateData.deliveryAddress}`, 50, 240, { width: 250 });
      doc.moveDown();
      
      // Payment information
      doc.text(`Payment Method: ${templateData.paymentMethod}`, 300, 180);
      doc.text(`Order Status: ${templateData.orderStatus}`, 300, 200);
      doc.text(`Tracking Number: ${templateData.trackingNumber || 'N/A'}`, 300, 220);
      doc.moveDown();
      
      // Table header
      let yPosition = 300;
      doc.fontSize(10);
      doc.text('Product', 50, yPosition);
      doc.text('Quantity', 250, yPosition);
      doc.text('Unit Price', 350, yPosition);
      doc.text('Total', 450, yPosition);
      
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;
      
      // Table rows
      templateData.items.forEach((item) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.text(item.name, 50, yPosition, { width: 180 });
        doc.text(item.quantity.toString(), 250, yPosition);
        doc.text(`₹${item.unitPrice}`, 350, yPosition);
        doc.text(`₹${item.subtotal}`, 450, yPosition);
        
        yPosition += 20;
      });
      
      yPosition += 10;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 20;
      
      // Summary
      doc.text(`Subtotal: ₹${templateData.subtotal}`, 400, yPosition);
      yPosition += 20;
      
      if (templateData.freeShipping) {
        doc.text('Shipping: FREE', 400, yPosition);
      } else {
        doc.text(`Shipping: ₹${templateData.shipping}`, 400, yPosition);
      }
      
      yPosition += 20;
      doc.text(`Tax (18% GST): ₹${templateData.tax}`, 400, yPosition);
      yPosition += 20;
      
      doc.fontSize(14).text(`Total Amount: ₹${templateData.totalAmount}`, 400, yPosition, { align: 'right' });
      
      // Footer
      doc.fontSize(10);
      doc.text('Thank you for your business!', 50, 750, { align: 'center' });
      doc.text('Suyambu Stores - Quality Products, Best Prices', 50, 765, { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to send invoice email with PDF attachment
async function sendInvoiceEmail(order, templateData, pdfBuffer) {
  try {
    // Read and compile email template
    const emailTemplatePath = path.join(__dirname, '../EmailTemplates/InvoiceEmail.html');
    const emailTemplateSource = await fs.readFile(emailTemplatePath, 'utf-8');
    const emailTemplate = handlebars.compile(emailTemplateSource);
    const emailContent = emailTemplate({
      customerName: templateData.customerName,
      orderId: templateData.orderId,
      orderDate: templateData.orderDate,
      totalAmount: templateData.totalAmount,
      baseUrl: templateData.baseUrl
    });
    
    const mailOptions = {
      from: {
        name: 'Suyambu Stores',
        address: process.env.EMAIL_USER
      },
      to: order.customer_email,
      subject: `Order Confirmation & Invoice - Order #${templateData.orderId} - Suyambu Stores`,
      html: emailContent,
      attachments: [
        {
          filename: `Invoice-${templateData.orderId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent successfully to ${order.customer_email} for order ${templateData.orderId}`);
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
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

      // Generate and send invoice email asynchronously with PDF attachment
      setImmediate(async () => {
        try {
          console.log(`Starting invoice generation for order ${orderId}`);
          
          // Generate invoice data
          const { templateData, order } = await generateInvoiceData(orderId);
          
          // Generate PDF using PDFKit
          const pdfBuffer = await generatePDFFromHTML(templateData);
          
          // Send email with PDF attachment
          await sendInvoiceEmail(order, templateData, pdfBuffer);
          
          console.log(`Invoice sent successfully for order ${orderId}`);
        } catch (invoiceError) {
          console.error(`Failed to send invoice for order ${orderId}:`, invoiceError);
          // Don't fail the order placement if invoice fails
        }
      });

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

// New function to get invoice data for frontend PDF generation
exports.getInvoiceData = async (req, res) => {
  const { orderId } = req.params;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Verify order belongs to the authenticated customer
    const [orderCheck] = await db.query('SELECT customer_id FROM orders WHERE id = ?', [orderId]);
    if (orderCheck.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (orderCheck[0].customer_id !== decoded.id) {
      return res.status(403).json({ message: 'Access denied: Order does not belong to you' });
    }

    // Generate invoice data
    const { templateData } = await generateInvoiceData(orderId);

    // Generate PDF using PDFKit
    const pdfBuffer = await generatePDFFromHTML(templateData);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${orderId}.pdf`);
    
    // Send the PDF buffer as response
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Get invoice data error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Failed to get invoice data: ' + error.message });
  }
};