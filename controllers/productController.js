import apparelModel from "../models/apparelSchema.js";
import equipmentModel from "../models/equipmentSchema.js";
import nutritionModel from "../models/nutritionSchema.js";
import fs from 'fs/promises';
// import fs from 'fs';
import xlsx from 'xlsx';
import csv from 'csvtojson'
import productModel from "../models/productModels.js";
import { isValidObjectId } from "mongoose";
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const productCreate = async (req, res) => {
  try {
    let { productCategory } = req.body;
    let Model;

    // Parse JSON fields if sent as strings (when using multipart/form-data)
    if (typeof req.body.productVarient === 'string') {
      req.body.productVarient = JSON.parse(req.body.productVarient);
    }
    if (typeof req.body.apparelDetails === 'string') {
      req.body.apparelDetails = JSON.parse(req.body.apparelDetails);
    }
    if (typeof req.body.equipmentDetails === 'string') {
      req.body.equipmentDetails = JSON.parse(req.body.equipmentDetails);
    }
    if (typeof req.body.nutritionDetails === 'string') {
      req.body.nutritionDetails = JSON.parse(req.body.nutritionDetails);
    }

    // Upload images to Cloudinary and delete temp files
    const productImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'products'
        });

        productImages.push({
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id
        });

        //Clean up uploaded file from 'uploads/' folder
        await fs.unlink(file.path);
      }
    }

    // Select the appropriate model based on productCategory
    switch (productCategory) {
      case 'Apparel':
        Model = apparelModel;
        break;
      case 'Equipment':
        Model = equipmentModel;
        break;
      case 'Nutrition':
        Model = nutritionModel;
        break;
      default:
        return res.status(400).json({ message: 'Invalid product category' });
    }

    const newProduct = new Model({
      ...req.body,
      productImages
    });

    await newProduct.save();

    res.status(201).json({
      message: 'Product created successfully!',
      product: newProduct
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal server error!'
    });
  }
};

const productBulkCreate = async (req, res) => {
  let filePath;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    filePath = req.file.path;
    const ext = (req.file.originalname.split(".").pop() || "").toLowerCase();

    let jsonData = [];
    if (ext === "csv") {
      // csv().fromFile returns a Promise -> await it
      jsonData = await csv().fromFile(filePath);
    } else if (ext === "xlsx") {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).json({ message: "No sheet found in workbook" });
      }
      const sheet = workbook.Sheets[sheetName];  // ✅ correct access
      jsonData = xlsx.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ message: "Unsupported file format!" });
    }

    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      return res.status(400).json({ message: "No data found in file" });
    }

    // Optional: parse JSON-string fields into arrays/objects
    const toJSON = (v, fallback = "[]") =>
      typeof v === "string" && v.trim().startsWith("[")
        ? JSON.parse(v)
        : Array.isArray(v) || typeof v === "object"
          ? v
          : JSON.parse(fallback);

    jsonData = jsonData.map((row) => ({
      ...row,
      productTags: toJSON(row.productTags ?? "[]"),
      productImages: toJSON(row.productImages ?? "[]"),
      productVarient: toJSON(row.productVarient ?? "[]"),
      careInstructions: toJSON(row.careInstructions ?? "[]"),
    }));

    // Insert
    const inserted = await productModel.insertMany(jsonData, { ordered: false });

    return res.status(201).json({
      status: "success",
      message: `${inserted.length} products inserted`,
      data: inserted,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error!" });
  } finally {
    if (filePath) {
      try { fs.unlinkSync(filePath); } catch { }
    }
  }
};

const productGetOne = async (req, res) => {
  try {
    const id = req.params.id;

    //  Properly validate ObjectId
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid or missing ID",
      });
    }

    // findById 
    const data = await productModel.findById(id);

    if (!data) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      message: "Data found successfully!",
      data,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const productGetAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    const skip = itemsPerPage * (page - 1);

    const [data, totalProducts] = await Promise.all([
      productModel.find().skip(skip).limit(itemsPerPage).lean().exec(),
      productModel.countDocuments().exec()
    ]);

    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    return res.status(200).json({
      message: "Data found successfully!",
      data,
      totalProducts,
      totalPages,
      currentPage: page,
      itemsPerPage: itemsPerPage
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error!"
    });
  }
};


const productUpdate = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    
    const productToUpdate = await productModel.findById(id);
    if (!productToUpdate) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updateData = { ...req.body };

    // Parse JSON fields if sent as strings
    const jsonFields = ['productVarient', 'apparelDetails', 'equipmentDetails', 'nutritionDetails'];
    for (const field of jsonFields) {
      if (typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          return res.status(400).json({ message: `Invalid JSON in field: ${field}` });
        }
      }
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'products'
        });
        productToUpdate.productImages.push({
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id
        });
        await fs.unlink(file.path);
      }
    }

    // Assign updated data and save
    Object.assign(productToUpdate, updateData);
    const updatedProduct = await productToUpdate.save();

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error("error", error);
    return res.status(500).json({
      message: "Internal server error!"
    });
  }
};

const updateProductStock = async (req, res) => {
  console.log("ddhggiuerurghffiue")
  try {
    console.log("update", req.body)

    if (!req.body || !Array.isArray(req.body.items)) {
      return res.status(400).json({ message: "Invalid body" });
    }

    for (let key of req.body.items) {
      let { productId: id, quantity, size } = key;

      if (!id || !quantity || !size) {
        return res.status(400).json({ message: "Invalid item data" });
      }

      let product = await productModel.findById(id);

      if (!product) {
        return res.status(400).json({ message: `Invalid product ID: ${id}` });
      }

      // Find the variant that matches the size
      let variant = product.productVarient.find(v => v.size === size);

      if (!variant) {
        return res.status(400).json({ message: `Size '${size}' not found for product ID: ${id}` });
      }

      // Check if there's enough stock
      if (variant.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for size '${size}' of product ID: ${id}` });
      }

      // Update stock
      variant.stock -= quantity;

      await product.save();
    }

    return res.status(200).json({ message: "Stock updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const productDelete = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" })
    }
    const product = await productModel.findByIdAndDelete(id);
    if (!product) {
      return res.status(400).json({ message: "Invalid id" })
    }
    return res.status(200).json({ message: "Product deleted successfully" })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
const searchProduct = async (req, res) => {
  try {
    const {
      query,
      productName,
      productBrand,
      productCategory,
      productTags,
      servingSize,
      weight,
      material,
      gender,
      fit
    } = req.query;

    const pipeline = [];

    const baseFilters = {};
    if (productName) baseFilters.productName = productName;
    if (productBrand) baseFilters.productBrand = productBrand;
    if (productCategory) baseFilters.productCategory = productCategory;
    if (productTags) baseFilters.productTags = productTags;
    if (minPrice && maxPrice) {
      baseFilters.productVarient = {
        $elemMatch: {
          price: { $gte: Number(minPrice), $lte: Number(maxPrice) }
        }
      };
    }
    if (color) {
      baseFilters.product = {
        $elemMatch: {
          color: color
        }
      }
    }



    if (Object.keys(baseFilters).length > 0) {
      pipeline.push({ $match: baseFilters });
    }

    if (query) {
      pipeline.push({
        $match: {
          $or: [
            { productName: { $regex: query, $options: 'i' } },
            { productBrand: { $regex: query, $options: 'i' } },
            { productCategory: { $regex: query, $options: 'i' } },
            { productTags: { $regex: query, $options: 'i' } }
          ]
        }
      });
    }

    const discriminatorFilters = {};
    if (productCategory === 'Nutrition' && servingSize) {
      discriminatorFilters.servingSize = servingSize;
    }

    if (productCategory === 'Equipment') {
      if (weight) discriminatorFilters.weight = weight;
      if (material) discriminatorFilters.material = material;
    }

    if (productCategory === 'Apparel') {
      if (gender) discriminatorFilters.gender = gender;
      if (fit) discriminatorFilters.fit = fit;
    }

    if (Object.keys(discriminatorFilters).length > 0) {
      pipeline.push({ $match: discriminatorFilters });
    }

    //   empty pipeline
    if (pipeline.length === 0) {
      return res.status(400).json({ message: "No valid filters provided." });
    }

    const products = await productModel.aggregate(pipeline);
   return res.status(200).json({ products });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  productCreate,
  productBulkCreate,
  productGetAll,
  productGetOne,
  productDelete,
  productUpdate,
  updateProductStock,
  searchProduct
}