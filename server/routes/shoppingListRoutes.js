const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getShoppingLists,
  getShoppingList,
  createShoppingList,
  deleteShoppingList,
  addProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/shoppingListController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Validation rules
const createListValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Shopping list name is required'),
];

const addProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('isChecked')
    .optional()
    .isBoolean()
    .withMessage('isChecked must be a boolean'),
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('isChecked')
    .optional()
    .isBoolean()
    .withMessage('isChecked must be a boolean'),
];

// All routes require authentication
router.use(protect);

// Shopping list routes
router
  .route('/')
  .get(getShoppingLists)
  .post(createListValidation, createShoppingList);

router
  .route('/:id')
  .get(getShoppingList)
  .delete(deleteShoppingList);

// Product routes
router
  .route('/:id/products')
  .post(upload.single('image'), addProductValidation, addProduct);

router
  .route('/:listId/products/:productId')
  .put(upload.single('image'), updateProductValidation, updateProduct)
  .delete(deleteProduct);

module.exports = router;

