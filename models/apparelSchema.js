import mongoose from "mongoose";
import productModel from "./productModels.js";

const ApparelSchema = new mongoose.Schema({
  material: { type: String, trim: true },
  gender: { type: String, enum: ['Men', 'Women', 'Unisex'] },
  fit: { type: String, trim: true },
  careInstructions: [String]
});

const apparelModel = productModel.discriminator("Apparel", ApparelSchema);
export default apparelModel;
