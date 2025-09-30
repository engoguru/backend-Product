import mongoose from "mongoose";
import productModel from "./productModels.js"; // ✅ Include .js extension

const EquipmentSchema = new mongoose.Schema({
    weight: {
        type: String,
        trim: true
    },
    dimensions: {
        type: String,
        trim: true
    },
    material: {
        type: String,
        trim: true
    },
    usage: {
        type: String,
        trim: true
    },
 subCategory: { type: String, trim: true },
});

const equipmentModel = productModel.discriminator("Equipment", EquipmentSchema);
export default equipmentModel;
