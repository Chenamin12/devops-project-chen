const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);

      expect(user._id).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email.toLowerCase());
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should hash password before saving', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });

    it('should not return password by default', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const foundUser = await User.findById(user._id);

      expect(foundUser.password).toBeUndefined();
    });

    it('should lowercase email', async () => {
      const userData = {
        username: 'testuser',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      };

      const user = await User.create(userData);

      expect(user.email).toBe('test@example.com');
    });

    it('should trim username and email', async () => {
      const userData = {
        username: '  testuser  ',
        email: '  test@example.com  ',
        password: 'password123',
      };

      const user = await User.create(userData);

      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('User Validation', () => {
    it('should require username', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require email', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce minimum username length', async () => {
      const userData = {
        username: 'ab',
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce maximum username length', async () => {
      const userData = {
        username: 'a'.repeat(31),
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce minimum password length', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '12345',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce unique username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      await User.create(userData);

      const duplicateUser = {
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password123',
      };

      await expect(User.create(duplicateUser)).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      await User.create(userData);

      const duplicateUser = {
        username: 'testuser2',
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(User.create(duplicateUser)).rejects.toThrow();
    });
  });

  describe('Password Matching', () => {
    it('should match correct password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const userWithPassword = await User.findById(user._id).select('+password');

      const isMatch = await userWithPassword.matchPassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should not match incorrect password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const userWithPassword = await User.findById(user._id).select('+password');

      const isMatch = await userWithPassword.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('Timestamps', () => {
    it('should add createdAt and updatedAt timestamps', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });
  });
});

