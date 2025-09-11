import express from 'express';
import productController from '../controllers/productController.js';
import { productSchema } from '../middleware/productValidation.js';
import uploads from '../middleware/productBulkFile.js';
import multer from 'multer';
const routes=express.Router();


const validate=(schema)=>(req,res,next)=>{
const {error}=schema.validate(req.body,{abortEarly:false});

  if (error) {
    return res.status(400).json({
      status: 'error',
      errors: error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }
    next();
}

const productUploadImage = multer({ dest: 'uploads/' }); // Saves uploaded files to 'uploads/' folder


import fs from "fs";
import path from "path";
import { authenticate, requireRole } from '../middleware/authentication.js';


const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase(); // includes dot
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".xlsx", ".csv"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Only .xlsx and .csv files are allowed!"));
};

export const upload = multer({ storage, fileFilter });

// validate(productSchema)

routes.post('/Create',validate(productSchema),productUploadImage.array('productImages')  ,productController.productCreate)

routes.post('/bulkCreate',upload.single('file'),productController.productBulkCreate);

routes.get('/GetAll',productController.productGetAll)

routes.get('/GetOne/:id',productController.productGetOne);

routes.put('/Update/:id',validate(productSchema),productUploadImage.array('productImages') ,productController.productUpdate);

routes.delete('/Delete/:id',authenticate,  requireRole('Admin'),productController.productDelete);

routes.post('/updateStock',productController.updateProductStock)



// seraching

routes.get('/search',productController.searchProduct)






export default routes;

 