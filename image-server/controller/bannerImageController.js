
const fs = require('fs');
const path = require('path');
const { upload, processFile } = require('../utils/FileUpload');

const uploadBannerImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const { company_name } = req.body;
    if (!company_name) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    const sanitizedCompanyName = company_name.replace(/\s+/g, '_');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    const fileName = `${randomNum}_${timestamp}_${sanitizedCompanyName}_banner_image.webp`;

    const imageUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      'banner',
      sanitizedCompanyName,
      fileName
    );

    res.status(200).json({
      message: 'Banner image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('Banner Image Upload Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const uploadRectangleLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No rectangle logo uploaded' });
    }

    const { company_name } = req.body;
    if (!company_name) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    const sanitizedCompanyName = company_name.replace(/\s+/g, '_');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    const fileName = `${randomNum}_${timestamp}_${sanitizedCompanyName}_rectangle_logo.webp`;

    const imageUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      'banner',
      sanitizedCompanyName,
      fileName
    );

    res.status(200).json({
      message: 'Rectangle logo uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('Rectangle Logo Upload Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateBannerImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No new banner image uploaded' });
    }

    const { company_name, old_image_url } = req.body;
    if (!company_name || !old_image_url) {
      return res.status(400).json({ message: 'Company name and old image URL are required' });
    }

    const sanitizedCompanyName = company_name.replace(/\s+/g, '_');
    const uploadPath = path.join(__dirname, '../uploads/banner', sanitizedCompanyName);

    const oldFileName = old_image_url.split('/').pop();
    const oldFilePath = path.join(uploadPath, oldFileName);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    const newFileName = `${randomNum}_${timestamp}_${sanitizedCompanyName}_banner_image.webp`;

    const imageUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      'banner',
      sanitizedCompanyName,
      newFileName
    );

    res.status(200).json({
      message: 'Banner image updated successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('Banner Image Update Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateRectangleLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No new rectangle logo uploaded' });
    }

    const { company_name, old_image_url } = req.body;
    if (!company_name || !old_image_url) {
      return res.status(400).json({ message: 'Company name and old image URL are required' });
    }

    const sanitizedCompanyName = company_name.replace(/\s+/g, '_');
    const uploadPath = path.join(__dirname, '../uploads/banner', sanitizedCompanyName);

    const oldFileName = old_image_url.split('/').pop();
    const oldFilePath = path.join(uploadPath, oldFileName);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    const newFileName = `${randomNum}_${timestamp}_${sanitizedCompanyName}_rectangle_logo.webp`;

    const imageUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      'banner',
      sanitizedCompanyName,
      newFileName
    );

    res.status(200).json({
      message: 'Rectangle logo updated successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('Rectangle Logo Update Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteBannerImage = async (req, res) => {
  try {
    const { company_name, image_url } = req.body;
    if (!company_name || !image_url) {
      return res.status(400).json({ message: 'Company name and image URL are required' });
    }

    const sanitizedCompanyName = company_name.replace(/\s+/g, '_');
    const uploadPath = path.join(__dirname, '../uploads/banner', sanitizedCompanyName);
    const fileName = image_url.split('/').pop();
    const filePath = path.join(uploadPath, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({ message: 'Banner image deleted successfully' });
    } else {
      return res.status(404).json({ message: 'Banner image not found' });
    }
  } catch (error) {
    console.error('Banner Image Delete Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// const deleteRectangleLogo = async (req, res) => {
//   try {
//     const { company_name, image_url } = req.body;
//     if (!company_name || !image_url) {
//       return res.status(400).json({ message: 'Company name and image URL are required' });
//     }

//     const sanitizedCompanyName = company_name.replace(/\s+/g, '_');
//     const uploadPath = path.join(__dirname, '../uploads/banner', sanitizedCompanyName);
//     const fileName = image_url.split('/').pop();
//     const filePath = path.join(uploadPath, fileName);

//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//       return res.status(200).json({ message: 'Rectangle logo deleted successfully' });
//     } else {
//       return res.status(404).json({ message: 'Rectangle logo not found' });
//     }
//   } catch (error) {
//     console.error('Rectangle Logo Delete Error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

const deleteRectangleLogo = async (req, res) => {
  try {
    const { company_name, image_url } = req.body;

    if (!company_name || !image_url) {
      return res.status(400).json({ message: "Company name and image URL are required" });
    }

    // Extract folder name from URL (after "/banner/")
    const urlParts = image_url.split("/banner/")[1];
    if (!urlParts) {
      return res.status(400).json({ message: "Invalid image URL format" });
    }

    const folderName = urlParts.split("/")[0];                // nk_chemicals
    const fileName = urlParts.split("/")[1];                  // 6981_1763461519474_nk_chemicals_rectangle_logo.webp

    // Build actual file path
    const uploadPath = path.join(__dirname, "../uploads/banner", folderName);
    const filePath = path.join(uploadPath, fileName);

    console.log("FOLDER:", folderName);
    console.log("FILE:", fileName);
    console.log("PATH:", filePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({ message: "Rectangle logo deleted successfully" });
    } else {
      return res.status(404).json({ message: "Rectangle logo not found" });
    }

  } catch (error) {
    console.error("Rectangle Logo Delete Error:", error);
    res.status(500).json({ message: error.message });
  }
};


const getBannerImage = async (req, res) => {
  try {
    const { company_name, file_name } = req.params;
    if (!company_name || !file_name) {
      return res.status(400).json({ message: 'Company name and file name are required' });
    }

    const sanitizedCompanyName = company_name.replace(/\s+/g, '_');
    const uploadPath = path.join(__dirname, '../uploads/banner', sanitizedCompanyName);
    const filePath = path.join(uploadPath, file_name);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      return res.status(404).json({ message: 'Banner image not found' });
    }
  } catch (error) {
    console.error('Get Banner Image Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadBannerImage,
  uploadRectangleLogo,
  updateBannerImage,
  updateRectangleLogo,
  deleteBannerImage,
  deleteRectangleLogo,
  getBannerImage,
};
