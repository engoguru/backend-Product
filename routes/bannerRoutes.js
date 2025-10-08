// routes/bannerRoutes.js
import express from 'express';
const Bannerrouter = express.Router();
import bannerController from '../controllers/bannerController.js';
import multer from 'multer';

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

// routes
Bannerrouter.get('/getAll', bannerController.getAllBanners);
Bannerrouter.post('/create', upload.single('bannerImage'), bannerController.uploadBanner);
Bannerrouter.put('/update/:id', upload.single('bannerImage'), bannerController.editBanner);
Bannerrouter.delete('/delete/:id', bannerController.deleteBanner);

export default Bannerrouter;
