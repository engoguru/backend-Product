//   use product feedback routes for routing

import { isValidObjectId } from "mongoose";
import cartModel from "../models/productCartModels.js";
import productModel from "../models/productModels.js";


// Helper to compare arrays (e.g., color arrays)
function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((val, index) => val === sortedB[index]);
}

const updateCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const item = req.body;

    // console.log("Incoming cart update:", { userId, item });

    // Validate userId and item
    if (!userId || !item || typeof item !== 'object') {
      return res.status(400).json({ message: 'User and valid item are required.' });
    }

    const { productId, size, price, color, quantity } = item;

    if (
      !productId ||
      !size ||
      price === undefined ||
      quantity === undefined
     
    ) {
      return res.status(400).json({ message: 'Item must have productId, size, price, quantity, and color (array).' });
    }

    // Find cart by userId
    let cart = await cartModel.findOne({ userId });

    if (!cart) {
      // Create new cart with valid item (quantity > 0)
      if (quantity <= 0) {
        return res.status(400).json({ error: 'Cannot add item with non-positive quantity.' });
      }

      cart = new cartModel({
        userId,
        items: [{
          productId,
          quantity,
          size,
          price,
          color: [...color].sort(),
          flavor: item.flavor?.trim() || '',
          category: item.category?.trim() || '',
          discount: item.discount || 0,
          productName: item.productName?.trim() || ''
        }]
      });

      await cart.save();
      return res.status(201).json({ message: 'New cart created with item.', cart });
    }

    // Cart exists — try to update existing item
    const trimmedFlavor = item.flavor?.trim() || '';
    const sortedColor = [...color].sort();

    const index = cart.items.findIndex(existingItem =>
      existingItem.productId === productId &&
      existingItem.size === size &&
      arraysEqual(existingItem.color, sortedColor) &&
      (existingItem.flavor?.trim() || '') === trimmedFlavor
    );

    if (index !== -1) {
      // Item exists — update quantity and price
      cart.items[index].quantity += quantity;
      cart.items[index].price = price;

      if (cart.items[index].quantity <= 0) {
        cart.items.splice(index, 1); // Remove item
      }
    } else if (quantity > 0) {
      // New item — add to cart
      cart.items.push({
        productId,
        quantity,
        size,
        price,
        color: sortedColor,
        flavor: trimmedFlavor,
        category: item.category?.trim() || '',
        discount: item.discount || 0,
        productName: item.productName?.trim() || ''
      });
    }

    // Delete cart if now empty
    if (cart.items.length === 0) {
      await cartModel.deleteOne({ userId });
      return res.status(200).json({ message: 'Cart was empty and has been deleted.' });
    }

    await cart.save();
    return res.status(200).json({ message: 'Cart updated successfully.', cart });

  } catch (error) {
    console.error('Error updating cart:', error);
    return res.status(500).json({ error: 'Server error updating cart.' });
  }
};






// const getUserCart = async (req, res) => {
//   try {
//        const { id } = req.params;

//     if (!id || !isValidObjectId(id)) {
//       return res.status(400).json({ error: "Invalid userId" });
//     }

//     const cart = await cartModel.findOne({ userId: id });
//     if (!cart) {
//       return res.status(404).json({ error: "Cart not found" })
//     }
// // find all productIds from cart items  
//     const productIds = cart.items.map(item => item.productId);
// // find products details from product service 
//     const products = await productModel.find({ _id: { $in: productIds } });

//     // again merge product details with cart items
//     const cartWithProductDetails = cart.items.map(item => {
//       const product = products.find(p => p._id.toString() === item.productId);
//       return {
//         ...item.toObject(),
//         productDetails: product || null
//       };
//     });

//     return res.status(200).json({ cart: cartWithProductDetails });
//   } catch (error) {
//     console.error('Error fetching cart:', error);
//     res.status(500).json({ error: 'Server error fetching cart.' });
//   }
// }

const getUserCart = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: user not authenticated.' });
    }

    const cart = await cartModel.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: 'No items found in cart.' });
    }

    res.status(200).json({ cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Server error fetching cart.' });
  }
};



export default {
  updateCart,
  getUserCart 
}







