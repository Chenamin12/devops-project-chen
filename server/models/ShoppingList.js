const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  image: {
    type: String,
    default: null,
  },
  isChecked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const shoppingListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Shopping list name is required'],
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  products: [productSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('ShoppingList', shoppingListSchema);

