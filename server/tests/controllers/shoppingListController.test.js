const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const ShoppingList = require('../../models/ShoppingList');
const shoppingListRoutes = require('../../routes/shoppingListRoutes');
const { protect } = require('../../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/shopping-lists', shoppingListRoutes);

describe('Shopping List Controller', () => {
  let token;
  let userId;
  let testList;

  beforeEach(async () => {
    // Create test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    userId = user._id;

    // Generate token
    token = jwt.sign({ id: userId }, process.env.JWT_SECRET);

    // Create test shopping list
    testList = await ShoppingList.create({
      name: 'Test List',
      user: userId,
      products: [],
    });
  });

  describe('GET /api/shopping-lists', () => {
    it('should get all shopping lists for user', async () => {
      // Create another list
      await ShoppingList.create({
        name: 'Second List',
        user: userId,
        products: [],
      });

      const response = await request(app)
        .get('/api/shopping-lists')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array if no lists exist', async () => {
      // Delete all lists
      await ShoppingList.deleteMany({});

      const response = await request(app)
        .get('/api/shopping-lists')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.count).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });

    it('should not get lists without token', async () => {
      await request(app)
        .get('/api/shopping-lists')
        .expect(401);
    });
  });

  describe('GET /api/shopping-lists/:id', () => {
    it('should get single shopping list', async () => {
      const response = await request(app)
        .get(`/api/shopping-lists/${testList._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test List');
    });

    it('should return 404 for non-existent list', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/shopping-lists/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Shopping list not found');
    });

    it('should not get list belonging to another user', async () => {
      // Create another user and list
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
      });
      const otherList = await ShoppingList.create({
        name: 'Other List',
        user: otherUser._id,
        products: [],
      });

      const response = await request(app)
        .get(`/api/shopping-lists/${otherList._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Shopping list not found');
    });
  });

  describe('POST /api/shopping-lists', () => {
    it('should create new shopping list', async () => {
      const response = await request(app)
        .post('/api/shopping-lists')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New List' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New List');
      expect(response.body.data.user.toString()).toBe(userId.toString());
    });

    it('should not create list without name', async () => {
      const response = await request(app)
        .post('/api/shopping-lists')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should not create list without token', async () => {
      await request(app)
        .post('/api/shopping-lists')
        .send({ name: 'New List' })
        .expect(401);
    });
  });

  describe('DELETE /api/shopping-lists/:id', () => {
    it('should delete shopping list', async () => {
      const response = await request(app)
        .delete(`/api/shopping-lists/${testList._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Shopping list deleted');

      // Verify list is deleted
      const deletedList = await ShoppingList.findById(testList._id);
      expect(deletedList).toBeNull();
    });

    it('should return 404 for non-existent list', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/shopping-lists/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Shopping list not found');
    });
  });

  describe('POST /api/shopping-lists/:id/products', () => {
    it('should add product to shopping list', async () => {
      const response = await request(app)
        .post(`/api/shopping-lists/${testList._id}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Milk',
          quantity: 2,
          isChecked: false,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Milk');
      expect(response.body.data.products[0].quantity).toBe(2);
    });

    it('should not add product without name', async () => {
      const response = await request(app)
        .post(`/api/shopping-lists/${testList._id}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: 2,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should not add product with invalid quantity', async () => {
      const response = await request(app)
        .post(`/api/shopping-lists/${testList._id}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Milk',
          quantity: 0,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/shopping-lists/:listId/products/:productId', () => {
    let productId;

    beforeEach(async () => {
      testList.products.push({
        name: 'Milk',
        quantity: 2,
        isChecked: false,
      });
      await testList.save();
      productId = testList.products[0]._id;
    });

    it('should update product in shopping list', async () => {
      const response = await request(app)
        .put(`/api/shopping-lists/${testList._id}/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Milk',
          quantity: 3,
          isChecked: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products[0].name).toBe('Updated Milk');
      expect(response.body.data.products[0].quantity).toBe(3);
      expect(response.body.data.products[0].isChecked).toBe(true);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeProductId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/shopping-lists/${testList._id}/products/${fakeProductId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Milk',
        })
        .expect(404);

      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('DELETE /api/shopping-lists/:listId/products/:productId', () => {
    let productId;

    beforeEach(async () => {
      testList.products.push({
        name: 'Milk',
        quantity: 2,
        isChecked: false,
      });
      await testList.save();
      productId = testList.products[0]._id;
    });

    it('should delete product from shopping list', async () => {
      const response = await request(app)
        .delete(`/api/shopping-lists/${testList._id}/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted');

      // Verify product is deleted
      const updatedList = await ShoppingList.findById(testList._id);
      expect(updatedList.products).toHaveLength(0);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeProductId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/shopping-lists/${testList._id}/products/${fakeProductId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Product not found');
    });
  });
});

