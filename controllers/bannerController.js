import bannerModel from "../models/bannerModels.js";
import cloudinary from "cloudinary";
import fs from "fs/promises"; // for deleting temp file

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Upload new banner
const uploadBanner = async (req, res) => {
  try {
    const { title, category, subtitle, offer } = req.body;
    const file = req.file;

    if (!file || !title || !category) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: 'bannerImage',
    });

    // Optional: delete file from server
    await fs.unlink(file.path);

    const newBanner = new bannerModel({
      bannerImage: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      },
      title,
      category,
      subtitle,
      offer
    });

    await newBanner.save();

    res.status(201).json({ message: "Banner uploaded successfully", banner: newBanner });
  } catch (error) {
    console.error("Error uploading banner:", error);
    res.status(500).json({ message: "Server error while uploading banner" });
  }
};

// Edit existing banner
const editBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, subtitle, offer } = req.body;
    const file = req.file;

    const banner = await bannerModel.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    let updatedImage = banner.bannerImage;

    if (file) {
      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(banner.bannerImage.public_id);

      // Upload new image
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: 'bannerImage',
      });

      // Clean up local file
      await fs.unlink(file.path);

      updatedImage = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      };
    }

    banner.title = title || banner.title;
    banner.category = category || banner.category;
    banner.subtitle = subtitle || banner.subtitle;
    banner.offer = offer || banner.offer;
    banner.bannerImage = updatedImage;

    const updatedBanner = await banner.save();

    res.status(200).json({ message: "Banner updated successfully", banner: updatedBanner });
  } catch (error) {
    console.error("Error editing banner:", error);
    res.status(500).json({ message: "Server error while editing banner" });
  }
};

export { uploadBanner, editBanner };
