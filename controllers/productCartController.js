//   use product feedback routes for routing

import { isValidObjectId } from "mongoose";
import cartModel from "../models/productCartModels.js";
import productModel from "../models/productModels.js";

const updateCart = async (req, res) => {
  try {
    const { userId, items } = req.body;

    // Validate userId and items
    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'userId and items[] are required.' });
    }

    // Validate each item
    for (const item of items) {
      const { productId, size, price, color, quantity } = item;
      if (
        !productId ||
        !size ||
        price === undefined ||
        color === undefined ||
        quantity === undefined
      ) {
        return res.status(400).json({ error: 'Each item must have productId, size, price, color, and inv.' });
      }
    }

    // Find cart by userId
    let cart = await cartModel.findOne({ userId });

    if (!cart) {
      // Create new cart with all items (filter out inv <= 0)
      const newItems = items
        .filter(item => item.inv > 0)
        .map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          flavor: item.flavor?.trim() || ''
        }));

      if (newItems.length === 0) {
        return res.status(400).json({ error: 'No valid items to add to new cart.' });
      }

      cart = new cartModel({
        userId,
        items: newItems
      });

      await cart.save();
      return res.status(201).json({ message: 'New cart created with items.', cart });
    }

    // Existing cart: update or add items
    for (const incomingItem of items) {
      const { productId, size, price, color, flavor, quantity } = incomingItem;
      const trimmedFlavor = flavor?.trim() || '';

      const index = cart.items.findIndex(
        item =>
          item.productId === productId &&
          item.size === size &&
          item.color === color &&
          (item.flavor?.trim() || '') === trimmedFlavor
      );

      if (index !== -1) {
        // Item exists → update quantity
        cart.items[index].quantity += quantity;

        // Remove if quantity <= 0
        if (cart.items[index].quantity <= 0) {
          cart.items.splice(index, 1);
        }
      } else if (quantity > 0) {
        // New item → add
        cart.items.push({
          productId,
          quantity: quantity,
          size,
          price,
          color,
          flavor: trimmedFlavor
        });
      }
    }

    // Delete cart if no items left
    if (cart.items.length === 0) {
      await cartModel.deleteOne({ userId });
      return res.status(200).json({ message: 'Cart is empty and deleted.' });
    }

    // Save updated cart
    await cart.save();
    return res.status(200).json({ message: 'Cart updated successfully.', cart });

  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Server error updating cart.' });
  }
}


const getUserCart = async (req, res) => {
  try {
       const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const cart = await cartModel.findOne({ userId: id });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" })
    }
// find all productIds from cart items  
    const productIds = cart.items.map(item => item.productId);
// find products details from product service 
    const products = await productModel.find({ _id: { $in: productIds } });

    // again merge product details with cart items
    const cartWithProductDetails = cart.items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        ...item.toObject(),
        productDetails: product || null
      };
    });

    return res.status(200).json({ cart: cartWithProductDetails });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Server error fetching cart.' });
  }
}
export default {
  updateCart,
  getUserCart 
}




