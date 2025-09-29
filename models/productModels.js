import mongoose from 'mongoose'

const varientSchema = new mongoose.Schema({
    sku: {
        type: String,
        trim: true
    },
    size: {
        type: String,
        trim: true
    },
    color: [{
        type: String,
        trim: true
    }],
    flavor: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    // originalPrice: {
    //     type: Number,
    //     required: true
    // },
    discount: {
        type: Number,
        default: 0
    },
    stock: {    // also add total and like m -size have 5 color every color wwith stock 
        type: Number,
        default: 0
    },

})

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, 'Product Name is Required !'],
        trim: true
    },
    productBrand: {
        type: String,
        trim: true,
        required: [true, 'Product Brand Name is required !']
    },
    productCategory: {
        type: String,
        trim: true,
        required: [true, 'Product Category is required !'],
        enum: ['Apparel', 'Equipment', 'Nutrition']
    },
    productDescription: {
        type: String,
        trim: true,
        required: [true, 'Product Description is required']
    },

    productDiscount: {
        type: String,
        trim: true
    },
    productTags: [String],
    productImages: [
        {
            url: String,
            public_id: String
        }
    ],
    productVarient: [varientSchema],

},
    {
        discriminatorKey: 'productCategory',
        timestamps: true

    })

const productModel = mongoose.model("ProductData", productSchema);
export default productModel;

