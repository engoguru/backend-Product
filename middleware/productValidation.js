
import Joi from 'joi';

// Variant schema
const variantSchema = Joi.object({
  sku: Joi.string().trim().optional(),
  size: Joi.string().trim().optional(),
  color: Joi.string().trim().optional(),
  flavor: Joi.string().trim().optional(),
  price: Joi.number().required().messages({
    'any.required': 'Price is required'
  }),
  // originalPrice: Joi.number().required().messages({
  //   'any.required': 'Original Price is required'
  // }),
  stock: Joi.number().optional().default(0),

});

// Apparel details
const apparelDetailsSchema = Joi.object({
  material: Joi.string().required(),
  gender: Joi.string().valid('Men', 'Women', 'Unisex').required(),
  fit: Joi.string().optional(),
  careInstructions: Joi.array().items(Joi.string()).optional()
});

// Equipment details
const equipmentDetailsSchema = Joi.object({
  weight: Joi.string().required(),
  dimensions: Joi.string().required(),
  material: Joi.string().required(),
  usage: Joi.string().optional()
});

// Nutrition details
const nutritionDetailsSchema = Joi.object({
  servingSize: Joi.string().required(),
  calories: Joi.string().required(),
  protein: Joi.string().required(),
  carbs: Joi.string().required(),
  fat: Joi.string().required(),
  ingredients: Joi.array().items(Joi.string()).required(),
  allergens: Joi.array().items(Joi.string()).optional()
});


// Main schema with conditional validation
export const productSchema = Joi.object({
  productName: Joi.string().trim().required(),
  productBrand: Joi.string().trim().required(),
  productCategory: Joi.string()
    .valid('Apparel', 'Equipment', 'Nutrition')
    .required(),

  productDescription: Joi.string().trim().required(),

  productDiscount: Joi.string().trim().optional(),

  productTags: Joi.array().items(Joi.string()).optional(),

  productVarient: Joi.array().items(variantSchema).required(),
    productImages: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      public_id: Joi.string().required()
    })
  ).optional(),

  // Conditional schemas
  apparelDetails: Joi.when('productCategory', {
    is: 'Apparel',
    then: apparelDetailsSchema.required(),
    otherwise: Joi.forbidden()
  }),

  equipmentDetails: Joi.when('productCategory', {
    is: 'Equipment',
    then: equipmentDetailsSchema.required(),
    otherwise: Joi.forbidden()
  }),

  nutritionDetails: Joi.when('productCategory', {
    is: 'Nutrition',
    then: nutritionDetailsSchema.required(),
    otherwise: Joi.forbidden()
  })
});
