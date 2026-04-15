// const path = require("path");
// const fs = require("fs");
// const {processFile} = require("../utils/FileUpload");

// // 📤 Upload Product Image
// const uploadProductImage = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No image uploaded" });
//     }

//     const { product_name } = req.body;
//     if (!product_name) {
//       return res.status(400).json({ message: "Product name is required" });
//     }

//     const uploadPath = path.join(__dirname, "../uploads/product/images/");
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }

//     const fileName = `${product_name}_image.webp`.replace(/\s+/g, "_");

//     const imageUrl = await processFile(
//       req.file.buffer,
//       req.file.mimetype,
//       "product",
//       "images",
//       fileName
//     );

//     res.status(200).json({
//       message: "Product image uploaded successfully",
//       imageUrl,
//     });
//   } catch (error) {
//     console.error("Product Image Upload Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ♻️ Update Product Image
// const updateProductImage = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No new image uploaded" });
//     }

//     const { product_name } = req.body;
//     if (!product_name) {
//       return res.status(400).json({ message: "Product name is required" });
//     }

//     const uploadPath = path.join(__dirname, "../uploads/product/images/");
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }

//     const fileName = `${product_name}_image.webp`.replace(/\s+/g, "_");
//     const imagePath = path.join(uploadPath, fileName);

//     if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

//     const imageUrl = await processFile(
//       req.file.buffer,
//       req.file.mimetype,
//       "product",
//       "images",
//       fileName
//     );

//     res.status(200).json({
//       message: "Product image updated successfully",
//       imageUrl,
//     });
//   } catch (error) {
//     console.error("Product Image Update Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ❌ Delete Product Image
// const deleteProductImage = (req, res) => {
//   try {
//     const { product_name } = req.body;
//     if (!product_name) {
//       return res.status(400).json({ message: "Product name is required" });
//     }

//     const fileName = product_name.replace(/\s+/g, "_"); // use exact name
//     const imagePath = path.join(
//       __dirname,
//       "../uploads/product/images/",
//       fileName
//     );

//     if (fs.existsSync(imagePath)) {
//       fs.unlinkSync(imagePath);
//       return res.status(200).json({ message: "Product image deleted successfully" });
//     } else {
//       return res.status(404).json({ message: "Product image not found" });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// // 📥 Get Product Image
// const getProductImage = (req, res) => {
//   const { product_name } = req.params;

//   const fileName = `${product_name}_image.webp`.replace(/\s+/g, "_");
//   const imagePath = path.join(
//     __dirname,
//     "../uploads/product/images/",
//     fileName
//   );

//   if (!fs.existsSync(imagePath)) {
//     return res.status(404).json({ message: "Product image not found" });
//   }

//   res.sendFile(imagePath);
// };

// module.exports = {
//   uploadProductImage,
//   updateProductImage,
//   deleteProductImage,
//   getProductImage,
// };


const path = require("path");
const fs = require("fs");
const { processFile } = require("../utils/FileUpload");
const { v4: uuidv4 } = require("uuid");

// 📤 Upload Multiple Product Images
const uploadProductImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const { product_name } = req.body;
    if (!product_name) {
      return res.status(400).json({ message: "Product name is required" });
    }

    const imageUrls = await Promise.all(
      req.files.map((file) => {
        const uniqueName = `${product_name}_${uuidv4()}.webp`.replace(/\s+/g, "_");
        return processFile(file.buffer, file.mimetype, "product", "images", uniqueName);
      })
    );

    res.status(200).json({
      message: "Product images uploaded successfully",
      imageUrls,
    });
  } catch (error) {
    console.error("Product Image Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ♻️ Replace All Product Images
const updateProductImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No new images uploaded" });
    }

    const { product_name } = req.body;
    if (!product_name) {
      return res.status(400).json({ message: "Product name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/product/images/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Delete all files related to the product (based on prefix or actual DB list)
    const existingFiles = fs.readdirSync(uploadPath);
    existingFiles.forEach((file) => {
      if (file.includes(product_name)) {
        fs.unlinkSync(path.join(uploadPath, file));
      }
    });

    const imageUrls = await Promise.all(
      req.files.map((file) => {
        const uniqueName = `${product_name}_${uuidv4()}.webp`.replace(/\s+/g, "_");
        return processFile(file.buffer, file.mimetype, "product", "images", uniqueName);
      })
    );

    res.status(200).json({
      message: "Product images updated successfully",
      imageUrls,
    });
  } catch (error) {
    console.error("Product Image Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ❌ Delete Specific or All Product Images
const deleteProductImage = (req, res) => {
  try {
    const { file_names = [], product_name } = req.body;

    const uploadPath = path.join(__dirname, "../uploads/product/images/");
    if (!fs.existsSync(uploadPath)) {
      return res.status(404).json({ message: "Upload directory not found" });
    }

    let deleted = [];

    if (Array.isArray(file_names) && file_names.length > 0) {
      // Delete specific files
      file_names.forEach((file) => {
        const filePath = path.join(uploadPath, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deleted.push(file);
        }
      });
    } else if (product_name) {
      // Delete all files related to product_name
      const existingFiles = fs.readdirSync(uploadPath);
      existingFiles.forEach((file) => {
        if (file.includes(product_name)) {
          fs.unlinkSync(path.join(uploadPath, file));
          deleted.push(file);
        }
      });
    } else {
      return res.status(400).json({ message: "Please provide file_names or product_name" });
    }

    if (deleted.length === 0) {
      return res.status(404).json({ message: "No matching files found" });
    }

    res.status(200).json({ message: "Deleted successfully", deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📥 Get Product Image
const getProductImage = (req, res) => {
  const { file_name } = req.params;
  const imagePath = path.join(__dirname, "../uploads/product/images/", file_name);

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ message: "Product image not found" });
  }

  res.sendFile(imagePath);
};

module.exports = {
  uploadProductImage,
  updateProductImage,
  deleteProductImage,
  getProductImage,
};
