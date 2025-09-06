const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.post('/register', customerController.register);
router.post('/login', customerController.login);
router.get('/profile', customerController.getProfile);

// New cart routes
router.post('/cart', customerController.addToCart);
router.get('/cart', customerController.getCart);
router.put('/cart', customerController.updateCartQuantity);
router.delete('/cart', customerController.deleteFromCart);

// Wishlist routes
router.get('/wishlist', customerController.getWishlist);
router.post('/wishlist', customerController.toggleWishlist);

// Address routes
router.get('/addresses', customerController.getAddresses);
router.post('/addresses', customerController.addAddress);
router.put('/addresses', customerController.updateAddress);
router.delete('/addresses', customerController.deleteAddress);

// Customer details route
router.get('/customer-details', customerController.getCustomerDetails);

module.exports = router;