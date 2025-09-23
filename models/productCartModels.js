import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  items: [
    {
      productId: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      size: {
        type: String,
        required: true
      },
      color: {
        type: [String], // ✅ Array of strings

      },
      flavor: {
        type: String,
        trim: true
      },
      price: {
        type: Number,
        required: true
      },
      category: {
        type: String,
        trim: true
      },
      discount: {
        type: Number,
        default: 0
      },
      productName: {
        type: String,
        trim: true
      }
    }
  ]
}, { timestamps: true });

const cartModel = mongoose.model("CartData", cartSchema);
export default cartModel;