// const db = require("../config/db");
// const jwt = require("jsonwebtoken");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const IMAGE_BASE = "http://localhost:5000";
// exports.login = async (req, res) => {
//   const { login, password } = req.body;

//   if (!login || !password) {
//     console.error('Login failed: Missing login or password');
//     return res.status(400).json({ message: 'Username or email and password are required' });
//   }

//   try {
//     const [admins] = await db.query(
//       'SELECT id, username, password, email, full_name FROM admins WHERE username = ? OR email = ?',
//       [login, login]
//     );
//     if (admins.length === 0) {
//       console.error('Login failed: No admin found with username or email:', login);
//       return res.status(401).json({ message: 'Invalid username or email' });
//     }

//     const admin = admins[0];
//     if (password !== admin.password) {
//       console.error('Login failed: Invalid password for admin:', admin.id);
//       return res.status(401).json({ message: 'Invalid password' });
//     }

//     const token = jwt.sign(
//       { id: admin.id, username: admin.username, email: admin.email },
//       process.env.JWT_SECRET || 'your_jwt_secret',
//       { expiresIn: '1h' }
//     );

//     console.log(`Login successful for admin ${admin.id}, token generated`);
//     return res.status(200).json({
//       message: 'Login successful',
//       token,
//       adminId: admin.id,
//       full_name: admin.full_name,
//       email: admin.email,
//     });
//   } catch (error) {
//     console.error('Admin login error:', error.message, error.stack);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// // Verify admin token (unchanged)
// exports.verify = async (req, res) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.error('Verification failed: No token provided');
//     return res.status(401).json({ message: 'Unauthorized: No token provided' });
//   }

//   const token = authHeader.split(' ')[1];
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

//     const [admins] = await db.query('SELECT id FROM admins WHERE id = ?', [decoded.id]);
//     if (admins.length === 0) {
//       console.error('Verification failed: Admin not found for id:', decoded.id);
//       return res.status(404).json({ message: 'Admin not found' });
//     }

//     // console.log(`Admin ${decoded.id} verified successfully`);
//     return res.status(200).json({ message: 'Admin verified' });
//   } catch (error) {
//     console.error('Admin verification error:', error.message, error.stack);
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(401).json({ message: 'Invalid token' });
//     }
//     return res.status(500).json({ message: 'Server error' });
//   }
// };
// // Add new category
// exports.addCategory = async (req, res) => {
//   try {
//     const { name, description } = req.body;
//     if (!name) {
//       return res.status(400).json({ error: "Category name is required" });
//     }

//     const sql = `INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`;
//     const [result] = await db.query(sql, [name, description || null]);

//     return res.status(201).json({ message: "Category added successfully", id: result.insertId });
//   } catch (error) {
//     console.error("Error adding category:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// // Update category by ID
// exports.updateCategory = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, description } = req.body;

//     if (!name) {
//       return res.status(400).json({ error: "Category name is required" });
//     }

//     const [existing] = await db.query("SELECT id FROM categories WHERE id = ?", [id]);
//     if (existing.length === 0) {
//       return res.status(404).json({ error: "Category not found" });
//     }

//     const sql = `UPDATE categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?`;
//     await db.query(sql, [name, description || null, id]);

//     return res.status(200).json({ message: "Category updated successfully" });
//   } catch (error) {
//     console.error("Error updating category:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// // Delete category by ID
// exports.deleteCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [existing] = await db.query("SELECT id FROM categories WHERE id = ?", [id]);
//     if (existing.length === 0) {
//       return res.status(404).json({ error: "Category not found" });
//     }

//     await db.query("DELETE FROM categories WHERE id = ?", [id]);

//     return res.status(200).json({ message: "Category deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting category:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// // View all categories
// exports.viewCategories = async (req, res) => {
//   try {
//     const [rows] = await db.query("SELECT * FROM categories ORDER BY created_at DESC");
//     return res.status(200).json(rows);
//   } catch (error) {
//     console.error("Error fetching categories:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// // Helper function to parse additional_images
// const parseAdditionalImages = (images) => {
//   try {
//     if (!images) {
//       return [];
//     }
//     if (Array.isArray(images)) {
//       return images.map((img) =>
//         img && img.startsWith("/") ? `${IMAGE_BASE}${img}` : img
//       );
//     }
//     if (typeof images === "string") {
//       try {
//         const parsed = JSON.parse(images);
//         if (Array.isArray(parsed)) {
//           return parsed.map((img) =>
//             img && img.startsWith("/") ? `${IMAGE_BASE}${img}` : img
//           );
//         }
//       } catch {
//         return images
//           .split(",")
//           .map((img) => img.trim())
//           .filter((img) => img)
//           .map((img) => (img.startsWith("/") ? `${IMAGE_BASE}${img}` : img));
//       }
//     }
//     return [];
//   } catch (error) {
//     console.error("Error parsing additional_images:", error, images);
//     return [];
//   }
// };

// // Helper function to stringify additional_images
// const stringifyAdditionalImages = (imagesArray) => {
//   if (!Array.isArray(imagesArray)) return "[]";
//   return JSON.stringify(imagesArray);
// };

// // Multer storage for product images
// const productImageStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, "../public/productImages");
//     fs.mkdirSync(uploadPath, { recursive: true });
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
//   },
// });

// const productUpload = multer({
//   storage: productImageStorage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const filetypes = /jpeg|jpg|png|gif/;
//     const mimetype = filetypes.test(file.mimetype.toLowerCase());
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (mimetype && extname) {
//       return cb(null, true);
//     }
//     cb(new Error("Only image files are allowed"));
//   },
// }).fields([
//   { name: "thumbnail", maxCount: 1 },
//   { name: "additional_images", maxCount: 5 },
// ]);

// // exports.addProduct = [
// //   productUpload,
// //   async (req, res) => {
// //     try {
// //       const { name, description, price, stock_quantity, category_id } = req.body;

// //       if (!name || !price || !stock_quantity || !category_id) {
// //         return res.status(400).json({ error: "Missing required fields" });
// //       }

// //       let thumbnail_url = null;
// //       let additional_images = [];

// //       if (req.files) {
// //         if (req.files.thumbnail && req.files.thumbnail.length > 0) {
// //           thumbnail_url = `/productImages/${req.files.thumbnail[0].filename}`;
// //         }
// //         if (req.files.additional_images && req.files.additional_images.length > 0) {
// //           additional_images = req.files.additional_images.map(
// //             (file) => `/productImages/${file.filename}`
// //           );
// //         }
// //       }

// //       const sql = `
// //         INSERT INTO products 
// //         (name, description, price, stock_quantity, thumbnail_url, additional_images, category_id, admin_id, created_at, updated_at) 
// //         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
// //       `;

// //       const [result] = await db.query(sql, [
// //         name,
// //         description || null,
// //         price,
// //         stock_quantity,
// //         thumbnail_url,
// //         stringifyAdditionalImages(additional_images),
// //         category_id,
// //         1,
// //       ]);

// //       return res.status(201).json({ message: "Product added successfully", id: result.insertId });
// //     } catch (error) {
// //       console.error("Error adding product:", error);
// //       return res.status(500).json({ error: "Internal server error" });
// //     }
// //   },
// // ];


// exports.addProduct = [
//   productUpload,
//   async (req, res) => {
//     try {
//       const { name, description, price, stock_quantity, category_id, quantity, uom_id } = req.body;

//       if (!name || !price || !stock_quantity || !category_id || !quantity || !uom_id) {
//         return res.status(400).json({ error: "Missing required fields" });
//       }

//       let thumbnail_url = null;
//       let additional_images = [];

//       if (req.files) {
//         if (req.files.thumbnail && req.files.thumbnail.length > 0) {
//           thumbnail_url = `/productImages/${req.files.thumbnail[0].filename}`;
//         }
//         if (req.files.additional_images && req.files.additional_images.length > 0) {
//           additional_images = req.files.additional_images.map(
//             (file) => `/productImages/${file.filename}`
//           );
//         }
//       }

//       const sql = `
//         INSERT INTO products 
//         (name, description, price, stock_quantity, thumbnail_url, additional_images, category_id, admin_id, created_at, updated_at, quantity, uom_id) 
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
//       `;

//       const [result] = await db.query(sql, [
//         name,
//         description || null,
//         price,
//         stock_quantity,
//         thumbnail_url,
//         stringifyAdditionalImages(additional_images),
//         category_id,
//         1,
//         quantity,
//         uom_id,
//       ]);

//       return res.status(201).json({ message: "Product added successfully", id: result.insertId });
//     } catch (error) {
//       console.error("Error adding product:", error);
//       return res.status(500).json({ error: "Internal server error" });
//     }
//   },
// ];


// exports.updateProduct = [
//   productUpload,
//   async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { name, description, price, stock_quantity, category_id, existing_additional_images, quantity, uom_id } = req.body;

//       // Check if product exists
//       const [existing] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
//       if (existing.length === 0) {
//         return res.status(404).json({ error: "Product not found" });
//       }

//       const product = existing[0];

//       // Prepare update fields
//       const updateFields = {};
//       if (name) updateFields.name = name;
//       if (description !== undefined) updateFields.description = description || null;
//       if (price) updateFields.price = price;
//       if (stock_quantity) updateFields.stock_quantity = stock_quantity;
//       if (category_id) updateFields.category_id = category_id;
//       if (quantity) updateFields.quantity = quantity;
//       if (uom_id) updateFields.uom_id = uom_id;

//       let thumbnail_url = product.thumbnail_url;
//       let additional_images = [];

//       // Parse existing_additional_images from request body
//       let retainedImages = [];
//       if (existing_additional_images) {
//         try {
//           retainedImages = typeof existing_additional_images === "string"
//             ? JSON.parse(existing_additional_images)
//             : existing_additional_images;
//         } catch (error) {
//           console.error("Error parsing existing_additional_images:", error);
//           retainedImages = [];
//         }
//       }

//       // Get current images from DB
//       const currentImages = parseAdditionalImages(product.additional_images);

//       // Delete images that are no longer in retainedImages
//       const imagesToDelete = currentImages.filter((img) => !retainedImages.includes(img));
//       imagesToDelete.forEach((img) => {
//         const filePath = path.join(__dirname, "../public", img.replace(IMAGE_BASE, ""));
//         fs.unlink(filePath, (err) => {
//           if (err && err.code !== "ENOENT") {
//             console.error("Error deleting additional image:", err);
//           }
//         });
//       });

//       // Handle new images
//       if (req.files && req.files.additional_images && req.files.additional_images.length > 0) {
//         additional_images = req.files.additional_images.map((file) => `/productImages/${file.filename}`);
//       }

//       // Combine retained and new images
//       additional_images = [...retainedImages, ...additional_images];

//       if (req.files && req.files.thumbnail && req.files.thumbnail.length > 0) {
//         thumbnail_url = `/productImages/${req.files.thumbnail[0].filename}`;
//         if (product.thumbnail_url) {
//           const thumbnailPath = path.join(__dirname, "../public", product.thumbnail_url.replace(IMAGE_BASE, ""));
//           fs.unlink(thumbnailPath, (err) => {
//             if (err && err.code !== "ENOENT") {
//               console.error("Error deleting old thumbnail:", err);
//             }
//           });
//         }
//       }

//       updateFields.thumbnail_url = thumbnail_url;
//       updateFields.additional_images = stringifyAdditionalImages(additional_images);

//       if (Object.keys(updateFields).length === 0) {
//         return res.status(400).json({ error: "No fields provided for update" });
//       }

//       const sql = `
//         UPDATE products SET 
//           ${Object.keys(updateFields).map((key) => `${key} = ?`).join(", ")},
//           updated_at = NOW()
//         WHERE id = ?
//       `;
//       const values = [...Object.values(updateFields), id];

//       await db.query(sql, values);

//       return res.status(200).json({ message: "Product updated successfully" });
//     } catch (error) {
//       console.error("Error updating product:", error);
//       return res.status(500).json({ error: "Internal server error" });
//     }
//   },
// ];

// exports.deleteProduct = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [existing] = await db.query("SELECT id FROM products WHERE id = ?", [id]);
//     if (existing.length === 0) {
//       return res.status(404).json({ error: "Product not found" });
//     }

//     const [product] = await db.query("SELECT thumbnail_url, additional_images FROM products WHERE id = ?", [id]);
//     if (product.length > 0) {
//       if (product[0].thumbnail_url) {
//         const thumbnailPath = path.join(__dirname, "../public", product[0].thumbnail_url.replace(IMAGE_BASE, ""));
//         fs.unlink(thumbnailPath, (err) => {
//           if (err && err.code !== "ENOENT") {
//             console.error("Error deleting thumbnail:", err);
//           }
//         });
//       }
//       const additionalImages = parseAdditionalImages(product[0].additional_images);
//       additionalImages.forEach((img) => {
//         const filePath = path.join(__dirname, "../public", img.replace(IMAGE_BASE, ""));
//         fs.unlink(filePath, (err) => {
//           if (err && err.code !== "ENOENT") {
//             console.error("Error deleting additional image:", err);
//           }
//         });
//       });
//     }

//     await db.query("DELETE FROM products WHERE id = ?", [id]);

//     return res.status(200).json({ message: "Product deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting product:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// exports.viewProducts = async (req, res) => {
//   try {
//     const [rows] = await db.query(`
//       SELECT p.*, c.name AS category_name, c.description AS category_description, u.uom_name 
//       FROM products p 
//       LEFT JOIN categories c ON p.category_id = c.id 
//       LEFT JOIN uom_master u ON p.uom_id = u.id 
//       ORDER BY p.created_at DESC
//     `);

//     const parsedRows = rows.map((product) => ({
//       ...product,
//       thumbnail_url: product.thumbnail_url?.startsWith("/") ? `${IMAGE_BASE}${product.thumbnail_url}` : product.thumbnail_url || "",
//       additional_images: parseAdditionalImages(product.additional_images),
//     }));

//     return res.status(200).json(parsedRows);
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };



// exports.getUoms = async (req, res) => {
//   try {
//     const [rows] = await db.query('SELECT * FROM uom_master ORDER BY uom_name ASC');
//     return res.status(200).json(rows);
//   } catch (error) {
//     console.error("Error fetching UOMs:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };


// exports.viewCustomers = async (req, res) => {
//   try {
//     const [rows] = await db.query(`
//       SELECT id, username, email, full_name, phone, created_at, updated_at 
//       FROM customers 
//       ORDER BY created_at DESC
//     `);
//     return res.status(200).json(rows);
//   } catch (error) {
//     console.error("Error fetching customers:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };



// exports.getProfile = async (req, res) => {
//   try {
//     const { adminId } = req.params;

//     // Decode the adminId from base64
//     let decodedAdminId;
//     try {
//       decodedAdminId = Buffer.from(adminId, 'base64').toString('ascii');
//       // Ensure decodedAdminId is an integer
//       if (!/^\d+$/.test(decodedAdminId)) {
//         return res.status(400).json({ error: "Invalid adminId format" });
//       }
//       decodedAdminId = parseInt(decodedAdminId, 10);
//     } catch (error) {
//       return res.status(400).json({ error: "Invalid adminId format" });
//     }

//     const [admins] = await db.query(
//       "SELECT id, full_name, email FROM Admins WHERE id = ?",
//       [decodedAdminId]
//     );

//     if (admins.length === 0) {
//       return res.status(404).json({ error: "Admin not found" });
//     }

//     return res.status(200).json({
//       id: admins[0].id, // Send the actual integer ID
//       full_name: admins[0].full_name,
//       email: admins[0].email
//     });
//   } catch (error) {
//     console.error("Error fetching admin profile:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };
















const db = require("../config/db");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const IMAGE_BASE = "http://localhost:5000";

exports.login = async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    console.error('Login failed: Missing login or password');
    return res.status(400).json({ message: 'Username or email and password are required' });
  }

  try {
    const [admins] = await db.query(
      'SELECT id, username, password, email, full_name FROM admins WHERE username = ? OR email = ?',
      [login, login]
    );
    if (admins.length === 0) {
      console.error('Login failed: No admin found with username or email:', login);
      return res.status(401).json({ message: 'Invalid username or email' });
    }

    const admin = admins[0];
    if (password !== admin.password) {
      console.error('Login failed: Invalid password for admin:', admin.id);
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    console.log(`Login successful for admin ${admin.id}, token generated`);
    return res.status(200).json({
      message: 'Login successful',
      token,
      adminId: admin.id,
      full_name: admin.full_name,
      email: admin.email,
    });
  } catch (error) {
    console.error('Admin login error:', error.message, error.stack);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.verify = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Verification failed: No token provided');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const [admins] = await db.query('SELECT id FROM admins WHERE id = ?', [decoded.id]);
    if (admins.length === 0) {
      console.error('Verification failed: Admin not found for id:', decoded.id);
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res.status(200).json({ message: 'Admin verified' });
  } catch (error) {
    console.error('Admin verification error:', error.message, error.stack);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const sql = `INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`;
    const [result] = await db.query(sql, [name, description || null]);

    return res.status(201).json({ message: "Category added successfully", id: result.insertId });
  } catch (error) {
    console.error("Error adding category:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const [existing] = await db.query("SELECT id FROM categories WHERE id = ?", [idNum]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    const sql = `UPDATE categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?`;
    await db.query(sql, [name, description || null, idNum]);

    return res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const [existing] = await db.query("SELECT id FROM categories WHERE id = ?", [idNum]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    await db.query("DELETE FROM categories WHERE id = ?", [idNum]);

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.viewCategories = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories ORDER BY created_at DESC");
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const parseAdditionalImages = (images) => {
  try {
    if (!images) {
      return [];
    }
    if (Array.isArray(images)) {
      return images.map((img) =>
        img && img.startsWith("/") ? `${IMAGE_BASE}${img}` : img
      );
    }
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) {
          return parsed.map((img) =>
            img && img.startsWith("/") ? `${IMAGE_BASE}${img}` : img
          );
        }
      } catch {
        return images
          .split(",")
          .map((img) => img.trim())
          .filter((img) => img)
          .map((img) => (img.startsWith("/") ? `${IMAGE_BASE}${img}` : img));
      }
    }
    return [];
  } catch (error) {
    console.error("Error parsing additional_images:", error, images);
    return [];
  }
};

const stringifyAdditionalImages = (imagesArray) => {
  if (!Array.isArray(imagesArray)) return "[]";
  return JSON.stringify(imagesArray);
};

const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/productImages");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
  },
});

const productUpload = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype.toLowerCase());
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "additional_images", maxCount: 5 },
]);

exports.addProduct = [
  productUpload,
  async (req, res) => {
    try {
      const { name, description, price, stock_quantity, category_id, quantity, uom_id } = req.body;

      if (!name || !price || !stock_quantity || !category_id || !quantity || !uom_id) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      let thumbnail_url = null;
      let additional_images = [];

      if (req.files) {
        if (req.files.thumbnail && req.files.thumbnail.length > 0) {
          thumbnail_url = `/productImages/${req.files.thumbnail[0].filename}`;
        }
        if (req.files.additional_images && req.files.additional_images.length > 0) {
          additional_images = req.files.additional_images.map(
            (file) => `/productImages/${file.filename}`
          );
        }
      }

      const sql = `
        INSERT INTO products 
        (name, description, price, stock_quantity, thumbnail_url, additional_images, category_id, admin_id, created_at, updated_at, quantity, uom_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
      `;

      const [result] = await db.query(sql, [
        name,
        description || null,
        price,
        stock_quantity,
        thumbnail_url,
        stringifyAdditionalImages(additional_images),
        category_id,
        1,
        quantity,
        uom_id,
      ]);

      return res.status(201).json({ message: "Product added successfully", id: result.insertId });
    } catch (error) {
      console.error("Error adding product:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
];

exports.updateProduct = [
  productUpload,
  async (req, res) => {
    try {
      const { id } = req.params;
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const { name, description, price, stock_quantity, category_id, existing_additional_images, quantity, uom_id } = req.body;

      const [existing] = await db.query("SELECT * FROM products WHERE id = ?", [idNum]);
      if (existing.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const product = existing[0];

      const updateFields = {};
      if (name) updateFields.name = name;
      if (description !== undefined) updateFields.description = description || null;
      if (price) updateFields.price = price;
      if (stock_quantity) updateFields.stock_quantity = stock_quantity;
      if (category_id) updateFields.category_id = category_id;
      if (quantity) updateFields.quantity = quantity;
      if (uom_id) updateFields.uom_id = uom_id;

      let thumbnail_url = product.thumbnail_url;
      let additional_images = [];

      let retainedImages = [];
      if (existing_additional_images) {
        try {
          retainedImages = typeof existing_additional_images === "string"
            ? JSON.parse(existing_additional_images)
            : existing_additional_images;
        } catch (error) {
          console.error("Error parsing existing_additional_images:", error);
          retainedImages = [];
        }
      }

      const currentImages = parseAdditionalImages(product.additional_images);

      const imagesToDelete = currentImages.filter((img) => !retainedImages.includes(img));
      imagesToDelete.forEach((img) => {
        const filePath = path.join(__dirname, "../public", img.replace(IMAGE_BASE, ""));
        fs.unlink(filePath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("Error deleting additional image:", err);
          }
        });
      });

      if (req.files && req.files.additional_images && req.files.additional_images.length > 0) {
        additional_images = req.files.additional_images.map((file) => `/productImages/${file.filename}`);
      }

      additional_images = [...retainedImages, ...additional_images];

      if (req.files && req.files.thumbnail && req.files.thumbnail.length > 0) {
        thumbnail_url = `/productImages/${req.files.thumbnail[0].filename}`;
        if (product.thumbnail_url) {
          const thumbnailPath = path.join(__dirname, "../public", product.thumbnail_url.replace(IMAGE_BASE, ""));
          fs.unlink(thumbnailPath, (err) => {
            if (err && err.code !== "ENOENT") {
              console.error("Error deleting old thumbnail:", err);
            }
          });
        }
      }

      updateFields.thumbnail_url = thumbnail_url;
      updateFields.additional_images = stringifyAdditionalImages(additional_images);

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: "No fields provided for update" });
      }

      const sql = `
        UPDATE products SET 
          ${Object.keys(updateFields).map((key) => `${key} = ?`).join(", ")},
          updated_at = NOW()
        WHERE id = ?
      `;
      const values = [...Object.values(updateFields), idNum];

      await db.query(sql, values);

      return res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
      console.error("Error updating product:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
];

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const [existing] = await db.query("SELECT id FROM products WHERE id = ?", [idNum]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const [product] = await db.query("SELECT thumbnail_url, additional_images FROM products WHERE id = ?", [idNum]);
    if (product.length > 0) {
      if (product[0].thumbnail_url) {
        const thumbnailPath = path.join(__dirname, "../public", product[0].thumbnail_url.replace(IMAGE_BASE, ""));
        fs.unlink(thumbnailPath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("Error deleting thumbnail:", err);
          }
        });
      }
      const additionalImages = parseAdditionalImages(product[0].additional_images);
      additionalImages.forEach((img) => {
        const filePath = path.join(__dirname, "../public", img.replace(IMAGE_BASE, ""));
        fs.unlink(filePath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("Error deleting additional image:", err);
          }
        });
      });
    }

    await db.query("DELETE FROM products WHERE id = ?", [idNum]);

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.viewProducts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name, c.description AS category_description, u.uom_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN uom_master u ON p.uom_id = u.id 
      ORDER BY p.created_at DESC
    `);

    const parsedRows = rows.map((product) => ({
      ...product,
      thumbnail_url: product.thumbnail_url?.startsWith("/") ? `${IMAGE_BASE}${product.thumbnail_url}` : product.thumbnail_url || "",
      additional_images: parseAdditionalImages(product.additional_images),
    }));

    return res.status(200).json(parsedRows);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name, c.description AS category_description, u.uom_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN uom_master u ON p.uom_id = u.id 
      WHERE p.id = ?
    `, [idNum]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = rows[0];
    const parsedProduct = {
      ...product,
      thumbnail_url: product.thumbnail_url?.startsWith("/") ? `${IMAGE_BASE}${product.thumbnail_url}` : product.thumbnail_url || "",
      additional_images: parseAdditionalImages(product.additional_images),
    };

    return res.status(200).json(parsedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getUoms = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM uom_master ORDER BY uom_name ASC');
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching UOMs:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.viewCustomers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, username, email, full_name, phone, created_at, updated_at 
      FROM customers 
      ORDER BY created_at DESC
    `);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { adminId } = req.params;
    let decodedAdminId;
    try {
      decodedAdminId = Buffer.from(adminId, 'base64').toString('ascii');
      if (!/^\d+$/.test(decodedAdminId)) {
        return res.status(400).json({ error: "Invalid adminId format" });
      }
      decodedAdminId = parseInt(decodedAdminId, 10);
    } catch (error) {
      return res.status(400).json({ error: "Invalid adminId format" });
    }

    const [admins] = await db.query(
      "SELECT id, full_name, email FROM admins WHERE id = ?",
      [decodedAdminId]
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    return res.status(200).json({
      id: admins[0].id,
      full_name: admins[0].full_name,
      email: admins[0].email
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};