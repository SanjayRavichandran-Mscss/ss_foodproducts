const express = require("express");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.post("/login", adminController.login);
router.get("/verify", adminController.verify);
router.post("/categories", adminController.addCategory);
router.put("/categories/:id", adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);
router.get("/categories", adminController.viewCategories);
router.post("/products", adminController.addProduct);
router.patch("/products/:id", adminController.updateProduct);
router.delete("/products/:id", adminController.deleteProduct);
router.get("/products", adminController.viewProducts);
router.get("/customers", adminController.viewCustomers);
router.get("/profile/:adminId", adminController.getProfile);


module.exports = router;