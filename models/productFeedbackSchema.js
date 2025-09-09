import mongoose from 'mongoose';

const productFeedbackSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductData',
        required: true
    },
    feedbackImage: [{
          url:String,
          public_id:String  
        }],
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1000 },
   
   
},{timestamps: true});
const productFeedbackModel = mongoose.model('ProductFeedback', productFeedbackSchema);
export default productFeedbackModel;
