import mongoose from "mongoose";
import productModel from "./productModels.js"; // ✅ Add `.js` extension

const NutritionSchema = new mongoose.Schema({
    servingSize: {
        type: String,
        trim: true
    },
    calories: {
        type: String,
        trim: true
    },
    protein: {
        type: String,
        trim: true
    },
    carbs: {
        type: String,
        trim: true
    },
    fat: {
        type: String,
        trim: true
    },
    ingredients: [String],
    allergens: [String]
});

const nutritionModel = productModel.discriminator("Nutrition", NutritionSchema);
export default nutritionModel;
