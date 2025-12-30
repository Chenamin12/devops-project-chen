const ShoppingList = require('../../models/ShoppingList');
const User = require('../../models/User');
const mongoose = require('mongoose');

describe('ShoppingList Model', () => {
  let userId;

  beforeEach(async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    userId = user._id;
  });

  describe('ShoppingList Creation', () => {
    it('should create a new shopping list successfully', async () => {
      const listData = {
        name: 'My Shopping List',
        user: userId,
        products: [],
      };

      const list = await ShoppingList.create(listData);

      expect(list._id).toBeDefined();
      expect(list.name).toBe(listData.name);
      expect(list.user.toString()).toBe(userId.toString());
      expect(list.products).toEqual([]);
    });

    it('should trim list name', async () => {
      const listData = {
        name: '  My Shopping List  ',
        user: userId,
        products: [],
      };

      const list = await ShoppingList.create(listData);

      expect(list.name).toBe('My Shopping List');
    });
  });

  describe('ShoppingList Validation', () => {
    it('should require name', async () => {
      const listData = {
        user: userId,
        products: [],
      };

      await expect(ShoppingList.create(listData)).rejects.toThrow();
    });

    it('should require user', async () => {
      const listData = {
        name: 'My Shopping List',
        products: [],
      };

      await expect(ShoppingList.create(listData)).rejects.toThrow();
    });
  });

  describe('Product Management', () => {
    let shoppingList;

    beforeEach(async () => {
      shoppingList = await ShoppingList.create({
        name: 'My Shopping List',
        user: userId,
        products: [],
      });
    });

    it('should add product to shopping list', async () => {
      shoppingList.products.push({
        name: 'Milk',
        quantity: 2,
        isChecked: false,
      });

      await shoppingList.save();

      expect(shoppingList.products).toHaveLength(1);
      expect(shoppingList.products[0].name).toBe('Milk');
      expect(shoppingList.products[0].quantity).toBe(2);
      expect(shoppingList.products[0].isChecked).toBe(false);
    });

    it('should add multiple products', async () => {
      shoppingList.products.push(
        { name: 'Milk', quantity: 2, isChecked: false },
        { name: 'Bread', quantity: 1, isChecked: false }
      );

      await shoppingList.save();

      expect(shoppingList.products).toHaveLength(2);
    });

    it('should require product name', async () => {
      shoppingList.products.push({
        quantity: 2,
        isChecked: false,
      });

      await expect(shoppingList.save()).rejects.toThrow();
    });

    it('should require product quantity', async () => {
      shoppingList.products.push({
        name: 'Milk',
        isChecked: false,
      });

      await expect(shoppingList.save()).rejects.toThrow();
    });

    it('should enforce minimum quantity of 1', async () => {
      shoppingList.products.push({
        name: 'Milk',
        quantity: 0,
        isChecked: false,
      });

      await expect(shoppingList.save()).rejects.toThrow();
    });

    it('should set default isChecked to false', async () => {
      shoppingList.products.push({
        name: 'Milk',
        quantity: 2,
      });

      await shoppingList.save();

      expect(shoppingList.products[0].isChecked).toBe(false);
    });

    it('should add createdAt timestamp to product', async () => {
      shoppingList.products.push({
        name: 'Milk',
        quantity: 2,
        isChecked: false,
      });

      await shoppingList.save();

      expect(shoppingList.products[0].createdAt).toBeDefined();
    });

    it('should allow image field to be null', async () => {
      shoppingList.products.push({
        name: 'Milk',
        quantity: 2,
        image: null,
        isChecked: false,
      });

      await shoppingList.save();

      expect(shoppingList.products[0].image).toBeNull();
    });

    it('should allow image field to be set', async () => {
      shoppingList.products.push({
        name: 'Milk',
        quantity: 2,
        image: 'product-image.jpg',
        isChecked: false,
      });

      await shoppingList.save();

      expect(shoppingList.products[0].image).toBe('product-image.jpg');
    });
  });

  describe('Timestamps', () => {
    it('should add createdAt and updatedAt timestamps', async () => {
      const list = await ShoppingList.create({
        name: 'My Shopping List',
        user: userId,
        products: [],
      });

      expect(list.createdAt).toBeDefined();
      expect(list.updatedAt).toBeDefined();
    });
  });

  describe('Product Operations', () => {
    let shoppingList;

    beforeEach(async () => {
      shoppingList = await ShoppingList.create({
        name: 'My Shopping List',
        user: userId,
        products: [
          { name: 'Milk', quantity: 2, isChecked: false },
          { name: 'Bread', quantity: 1, isChecked: false },
        ],
      });
    });

    it('should find product by id', () => {
      const productId = shoppingList.products[0]._id;
      const product = shoppingList.products.id(productId);

      expect(product).toBeDefined();
      expect(product.name).toBe('Milk');
    });

    it('should update product', async () => {
      const product = shoppingList.products[0];
      product.name = 'Updated Milk';
      product.quantity = 3;
      product.isChecked = true;

      await shoppingList.save();

      const updatedList = await ShoppingList.findById(shoppingList._id);
      expect(updatedList.products[0].name).toBe('Updated Milk');
      expect(updatedList.products[0].quantity).toBe(3);
      expect(updatedList.products[0].isChecked).toBe(true);
    });

    it('should delete product', async () => {
      const productId = shoppingList.products[0]._id;
      shoppingList.products.id(productId).deleteOne();
      await shoppingList.save();

      const updatedList = await ShoppingList.findById(shoppingList._id);
      expect(updatedList.products).toHaveLength(1);
      expect(updatedList.products[0].name).toBe('Bread');
    });
  });
});

