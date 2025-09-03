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

router.get('/wishlist', customerController.getWishlist);
router.post('/wishlist', customerController.toggleWishlist);

module.exports = router;