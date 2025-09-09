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
      price: {
        type: Number,
        required: true
      },
      color:{
         type: Number,
        required: true
      },
     flavor: {
     type: String,
    trim: true
    },
    }
  ],
},{timestamps:true});

const cartModel=mongoose.model("CartData",cartSchema);
export default cartModel;