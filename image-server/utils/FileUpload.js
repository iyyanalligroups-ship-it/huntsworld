require("dotenv").config(); // Load .env variables
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// ✅ Load SERVER_URL from .env (Default to localhost)
const SERVER_URL = process.env.SERVER_URL || "http://localhost:8080";
console.log(`Server URL: ${SERVER_URL}`);

// ✅ Ensure dynamic folder creation
const createEntityFolder = (entity_type, company_name) => {
  // Replace spaces with underscores
  const sanitizedEntityType = entity_type.replace(/\s+/g, "_");
  const sanitizedCompanyName = company_name.replace(/\s+/g, "_");

  const uploadDir = path.join(
    __dirname,
    "../uploads",
    sanitizedEntityType,
    sanitizedCompanyName
  );

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return uploadDir;
};

// ✅ Allowed file types
const allowedMimeTypes = {
  image: ["image/jpeg","image/jpg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/avi", "video/mov", "video/mkv"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/webm"],
};

// ✅ Multer storage configuration (Using Memory Storage for processing)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allTypes = [
    ...allowedMimeTypes.image,
    ...allowedMimeTypes.video,
    ...allowedMimeTypes.audio,
  ];
  if (allTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images, videos, and audio files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // Max 200MB
});

// ✅ Compress and Save Image
const compressImage = async (buffer, outputPath) => {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (metadata.width > 2000) {
      await image.resize({ width: 2000 });
    }

    await image
      .toFormat("webp", { quality: 90 })
      .toFile(outputPath.replace(/\.\w+$/, ".webp"));
  } catch (error) {
    throw new Error("Image compression failed: " + error.message);
  }
};

// ✅ Compress and Save Video
const compressVideo = async (buffer, outputPath) => {
  return new Promise((resolve, reject) => {
    const tempFilePath = path.join(
      __dirname,
      "../uploads/temp_" + Date.now() + ".mp4"
    );
    fs.writeFileSync(tempFilePath, buffer);

    ffmpeg(fs.createReadStream(inputPath))
    .videoCodec("libx264")
    .outputOptions(["-preset fast", "-crf 28"])
    .on("end", () => { /* done */ })
    .on("error", err => { /* handle error */ })
    .save(outputPath)  
      .on("end", () => {
        fs.unlinkSync(tempFilePath);
        resolve();
      })
      .on("error", (err) =>
        reject(new Error("Video compression failed: " + err.message))
      )
      .save(outputPath.replace(/\.\w+$/, ".mp4"));
  });
};

// ✅ Compress and Save Audio
const compressAudio = async (buffer, outputPath) => {
  return new Promise((resolve, reject) => {
    const inputTempPath = path.join(
      __dirname,
      "../uploads/temp_" + Date.now() + ".webm"
    );
    const outputFinalPath = outputPath.replace(/\.\w+$/, ".mp3");

    fs.writeFileSync(inputTempPath, buffer);

    ffmpeg(inputTempPath)
      .inputFormat("webm") // ✅ explicitly state format
      .audioCodec("libmp3lame") // ✅ convert to MP3
      .audioBitrate("192k")
      .on("end", () => {
        fs.unlinkSync(inputTempPath);
        resolve();
      })
      .on("error", (err) => {
        fs.unlinkSync(inputTempPath);
        reject(new Error("Audio compression failed: " + err.message));
      })
      .save(outputFinalPath);
  });
};

// ✅ Process File and Return Public URL
const processFile = async (
  buffer,
  mimetype,
  entityType,
  companyName,
  fileName
) => {
  const uploadPath = createEntityFolder(entityType, companyName);
  const filePath = path.join(uploadPath, fileName);

  if (allowedMimeTypes.image.includes(mimetype)) {
    await compressImage(buffer, filePath);
    // For images, convert to .webp
    fileName = fileName.replace(/\.\w+$/, ".webp"); // change extension to .webp for images
  } else if (allowedMimeTypes.video.includes(mimetype)) {
    await compressVideo(buffer, filePath);
    // For videos, retain the original .mp4 extension
  } else if (allowedMimeTypes.audio.includes(mimetype)) {
    await compressAudio(buffer, filePath);
    fileName = fileName.replace(/\.\w+$/, ".mp3"); // ✅ ADD THIS LINE
  } else {
    throw new Error("Unsupported file type");
  }

  // ✅ Return the public file URL (Relative Path for Server)
  const publicUrl = `${SERVER_URL}/uploads/${entityType}/${companyName}/${fileName}`;
  return publicUrl;
};

module.exports = { upload, createEntityFolder, compressAudio, processFile };

