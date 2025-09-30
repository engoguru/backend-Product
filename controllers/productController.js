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

import mongoose from "mongoose";
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
  try {
    const items = req.body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid or empty items array" });
    }

    const bulkOperations = [];

    for (let item of items) {
      const { productId, quantity, size } = item;

      if (!productId || !quantity || !size) {
        return res.status(400).json({ message: "Missing required fields in one or more items" });
      }

      // Build bulk operation to decrement stock
      bulkOperations.push({
        updateOne: {
          filter: {
            _id: productId,
            'productVarient.size': size
          },
          update: {
            $inc: {
              'productVarient.$.stock': -quantity
            }
          }
        }
      });
    }

    const result = await productModel.bulkWrite(bulkOperations);

    return res.status(200).json({
      message: "Stock updated successfully",
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Stock update error:", error);
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
// const searchProduct = async (req, res) => {
//   try {
//     const {
//       query,
//       productName,
//       productBrand,
//       productCategory,
//       productTags,
//       servingSize,
//       weight,
//       material,
//       gender,
//       fit
//     } = req.query;

//     const pipeline = [];

//     const baseFilters = {};
//     if (productName) baseFilters.productName = productName;
//     if (productBrand) baseFilters.productBrand = productBrand;
//     if (productCategory) baseFilters.productCategory = productCategory;
//     if (productTags) baseFilters.productTags = productTags;
//     if (minPrice && maxPrice) {
//       baseFilters.productVarient = {
//         $elemMatch: {
//           price: { $gte: Number(minPrice), $lte: Number(maxPrice) }
//         }
//       };
//     }
//     if (color) {
//       baseFilters.product = {
//         $elemMatch: {
//           color: color
//         }
//       }
//     }



//     if (Object.keys(baseFilters).length > 0) {
//       pipeline.push({ $match: baseFilters });
//     }

//     if (query) {
//       pipeline.push({
//         $match: {
//           $or: [
//             { productName: { $regex: query, $options: 'i' } },
//             { productBrand: { $regex: query, $options: 'i' } },
//             { productCategory: { $regex: query, $options: 'i' } },
//             { productTags: { $regex: query, $options: 'i' } }
//           ]
//         }
//       });
//     }

//     const discriminatorFilters = {};
//     if (productCategory === 'Nutrition' && servingSize) {
//       discriminatorFilters.servingSize = servingSize;
//     }

//     if (productCategory === 'Equipment') {
//       if (weight) discriminatorFilters.weight = weight;
//       if (material) discriminatorFilters.material = material;
//     }

//     if (productCategory === 'Apparel') {
//       if (gender) discriminatorFilters.gender = gender;
//       if (fit) discriminatorFilters.fit = fit;
//     }

//     if (Object.keys(discriminatorFilters).length > 0) {
//       pipeline.push({ $match: discriminatorFilters });
//     }

//     //   empty pipeline
//     if (pipeline.length === 0) {
//       return res.status(400).json({ message: "No valid filters provided." });
//     }

//     const products = await productModel.aggregate(pipeline);
//    return res.status(200).json({ products });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };

const searchProduct = async (req, res) => {
  // console.log('Sort param:', req.query);
  try {
    const {
      query,
      productName,
      productBrand,
      productCategory,
      subCategory,
      productTags,
      servingSize,
      weight,
      material,
      gender,
      fit,
      color,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const pipeline = [];

    // Base Filters
    const baseFilters = {};
    if (productName) {
  baseFilters.productName = { $regex: productName, $options: 'i' }; // 'i' for case-insensitive
}
    if (productBrand) baseFilters.productBrand = productBrand;
    if (subCategory) baseFilters.subCategory = subCategory;
    if (productCategory) baseFilters.productCategory = productCategory;
    if (productTags) baseFilters.productTags = productTags;

    if (minPrice && maxPrice) {
      baseFilters.productVarient = {
        $elemMatch: {
          price: { $gte: Number(minPrice), $lte: Number(maxPrice) }
        }
      };
    }


  // Normalize color input to array
  let colorFilter = query['color[]'] || query?.color;
  if (colorFilter && !Array.isArray(colorFilter)) {
    colorFilter = [colorFilter];

  }

  if (colorFilter && colorFilter.length > 0) {
    baseFilters.productVarient = {
      $elemMatch: {
        color: { $in: colorFilter }
      }
    };
  }

    if (Object.keys(baseFilters).length > 0) {
      pipeline.push({ $match: baseFilters });
    }

    // Search Query
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

    // Discriminator Filters
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

    //  Proper sorting stage
if (sort === "high-to-low") {
  pipeline.push({ $sort: { "productVarient.price": -1 } });
} else if (sort === "low-to-high") {
  pipeline.push({ $sort: { "productVarient.price": 1 } });
}

    // Pagination setup
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageLimit = parseInt(limit);

    pipeline.push(
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: pageLimit }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    );
// console.log(baseFilters,"baseFilters")
    // If pipeline is empty, match all
    if (pipeline.length === 1) {
      pipeline.unshift({ $match: {} }); // match all products
    }

    const result = await productModel.aggregate(pipeline);

    const products = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    return res.status(200).json({
      products,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / pageLimit),
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



const getbulk_UserSpecific = async (req, res) => {
    try {
        const { ids } = req.body;

        // Validate input
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid or missing 'ids' array" });
        }

        // Filter out invalid ObjectIds
        const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));

        if (validIds.length === 0) {
            return res.status(400).json({ message: "No valid product IDs provided" });
        }

        // Fetch products in bulk
        const products = await productModel.find({ _id: { $in: validIds } });

        return res.status(200).json({ products });

    } catch (error) {
        console.error("Bulk fetch error:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};



const getRelevantProducts = async (req, res) => {
        try {
          const { category } = req.params;
    if (!category || !['Apparel', 'Equipment', 'Nutrition'].includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    // Fetch products from the same category, sorted by creation date (newest first)
    const relevantProducts = await productModel.find({
      productCategory: category,
    }).sort({ createdAt: -1 }).limit(4);
    return res.status(200).json({ relevantProducts });
  } catch (error) {
    console.error("Error fetching relevant products:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export default {
  productCreate,
  productBulkCreate,
  getRelevantProducts,
  productGetAll,
  productGetOne,
  productDelete,
  productUpdate,
  updateProductStock,
  searchProduct,
  getbulk_UserSpecific,
}