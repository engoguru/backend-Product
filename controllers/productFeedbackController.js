import productFeedbackModel from "../models/productFeedbackSchema.js";
import fs from 'fs/promises';
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});




const create = async (req, res) => {
  try {
    const { userId, productId, rating, comment } = req.body;

    if (!userId || !productId || !rating) {
      return res.status(400).json({ message: 'userId, productId, and rating are required.' });
    }

    // Upload feedback images to Cloudinary
    const feedbackImage = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'feedbackImages'
        });

        feedbackImage.push({
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id
        });

        // Clean up local file
        await fs.unlink(file.path);
      }
    }

    const feedback = new productFeedbackModel({
      userId,
      productId,
      rating,
      comment,
      feedbackImage
    });

    await feedback.save();

    return res.status(201).json({
      message: 'Feedback created successfully.',
      feedback
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};


const getByProductFeedBackId = async (req, res) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;      // Default to page 1
        const limit = parseInt(req.query.limit) || 10;   // Default to 10 items per page

        if (!productId) {
            return res.status(400).json({ message: 'productId is required.' });
        }

        const skip = (page - 1) * limit;

        const [feedbacks, total] = await Promise.all([
            productFeedbackModel
                .find({ productId })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }), // Optional: sort by most recent
            productFeedbackModel.countDocuments({ productId }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            feedbacks,
            page,
            totalPages,
            totalFeedbacks: total
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};
export default {
    create,
   getByProductFeedBackId
};