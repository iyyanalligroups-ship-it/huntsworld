const { processFile } = require('../utils/FileUpload');

// Upload verification images
exports.uploadVerificationImages = async (req, res) => {
  try {
    const { company_name } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    if (!company_name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    // Capitalize first letter of each word and replace space with underscore
    const formatCompanyName = (name) => {
      return name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('_');
    };

    const formattedCompanyName = formatCompanyName(company_name);

    // Process and store images
    const imageUrls = [];
    for (const file of files) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const timestamp = Date.now();
      const fileName = `${randomNum}_${timestamp}_${formattedCompanyName}.webp`;

      const imageUrl = await processFile(
        file.buffer,
        file.mimetype,
        "trust_seal",
        formattedCompanyName,
        fileName
      );

      imageUrls.push({
        url: imageUrl,
        uploaded_at: new Date()
      });
    }

    res.status(200).json({ 
      message: "Images uploaded successfully",
      imageUrls
    });
  } catch (error) {
    console.error("Upload Verification Images Error:", error);
    res.status(500).json({ message: error.message });
  }
};

