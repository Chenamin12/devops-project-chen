const ShoppingList = require('../models/ShoppingList');
const { validationResult } = require('express-validator');
const path = require('path');

// @desc    Get all shopping lists for a user
// @route   GET /api/shopping-lists
// @access  Private
exports.getShoppingLists = async (req, res) => {
  try {
    const lists = await ShoppingList.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: lists.length,
      data: lists,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single shopping list
// @route   GET /api/shopping-lists/:id
// @access  Private
exports.getShoppingList = async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new shopping list
// @route   POST /api/shopping-lists
// @access  Private
exports.createShoppingList = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const list = await ShoppingList.create({
      name,
      user: req.user.id,
      products: [],
    });

    res.status(201).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete shopping list
// @route   DELETE /api/shopping-lists/:id
// @access  Private
exports.deleteShoppingList = async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    // Delete images associated with products
    const fs = require('fs');
    list.products.forEach(product => {
      if (product.image) {
        const imagePath = path.join(process.env.UPLOAD_PATH || './uploads', product.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    });

    await list.deleteOne();

    res.json({
      success: true,
      message: 'Shopping list deleted',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add product to shopping list
// @route   POST /api/shopping-lists/:id/products
// @access  Private
exports.addProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const list = await ShoppingList.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    const { name, quantity, isChecked } = req.body;
    const image = req.file ? req.file.filename : null;

    const product = {
      name,
      quantity: parseInt(quantity),
      image,
      isChecked: isChecked || false,
      createdAt: new Date(),
    };

    list.products.push(product);
    await list.save();

    res.status(201).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update product in shopping list
// @route   PUT /api/shopping-lists/:listId/products/:productId
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const list = await ShoppingList.findOne({
      _id: req.params.listId,
      user: req.user.id,
    });

    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    const product = list.products.id(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update product fields
    if (req.body.name) product.name = req.body.name;
    if (req.body.quantity !== undefined) product.quantity = parseInt(req.body.quantity);
    if (req.body.isChecked !== undefined) product.isChecked = req.body.isChecked;
    
    // Handle image update
    if (req.file) {
      // Delete old image if exists
      const fs = require('fs');
      if (product.image) {
        const oldImagePath = path.join(process.env.UPLOAD_PATH || './uploads', product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      product.image = req.file.filename;
    }

    await list.save();

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete product from shopping list
// @route   DELETE /api/shopping-lists/:listId/products/:productId
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.listId,
      user: req.user.id,
    });

    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    const product = list.products.id(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete image if exists
    const fs = require('fs');
    if (product.image) {
      const imagePath = path.join(process.env.UPLOAD_PATH || './uploads', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    product.deleteOne();
    await list.save();

    res.json({
      success: true,
      message: 'Product deleted',
      data: list,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

