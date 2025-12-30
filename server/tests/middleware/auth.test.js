const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');
const { protect } = require('../../middleware/auth');

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should call next() with valid token', async () => {
    // Create test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    // Generate valid token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    mockReq.headers.authorization = `Bearer ${token}`;

    await protect(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user._id.toString()).toBe(user._id.toString());
  });

  it('should return 401 without token', async () => {
    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Not authorized, no token',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 with invalid token', async () => {
    mockReq.headers.authorization = 'Bearer invalid-token';

    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Not authorized, token failed',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 with token for non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ id: fakeId }, process.env.JWT_SECRET);
    mockReq.headers.authorization = `Bearer ${token}`;

    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 with token without Bearer prefix', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    mockReq.headers.authorization = token; // Missing 'Bearer ' prefix

    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Not authorized, no token',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

