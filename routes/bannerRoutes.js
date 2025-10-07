import express from 'express';
const Bannerrouter = express.Router();
import multer from 'multer';
import { uploadBanner, editBanner } from '../controllers/bannerController.js';

// Use disk storage to store temporarily before uploading to Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

Bannerrouter.post('/banner', upload.single('bannerImage'), uploadBanner);
Bannerrouter.put('/banner/:id', upload.single('bannerImage'), editBanner);

export default Bannerrouter;


