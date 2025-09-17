import express from 'express';
import productFeedbackController from '../controllers/productFeedbackController.js';
const routes = express.Router();

import multer from 'multer';
import { authenticate } from '../middleware/authentication.js';
import productCartController from '../controllers/productCartController.js';

const upload = multer({ dest: 'uploads/' }); // store files temporarily

// Route example

routes.post('/Create',authenticate,upload.array('feedbackImage'), productFeedbackController.create);
routes.get('/getfeedback/:productId', productFeedbackController.getByProductFeedBackId);


// Add to cart routes

routes.post("/cart",authenticate,productCartController.updateCart);
routes.get("/cart/:id",productCartController.getUserCart);


export  default routes;




