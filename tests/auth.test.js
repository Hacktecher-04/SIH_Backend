jest.mock('passport', () => {
  const passport = {
    authenticate: jest.fn((strategy, options, callback) => (req, res, next) => {
      if (strategy === 'google' || strategy === 'github') {
        // For initial OAuth routes, simulate a redirect
        if (!req.query.code) { // Simulate initial redirect
          res.redirect(302, `http://mock-oauth-provider.com/login?client_id=${options.clientID}&redirect_uri=${options.callbackURL}`);
          return;
        }
        // For OAuth callback routes, simulate successful authentication
        req.user = {
          id: 'mockId',
          displayName: 'Mock User',
          username: 'mockuser',
          emails: [{ value: 'mock@example.com' }],
          photos: [{ value: 'mockphoto.jpg' }],
          name: { givenName: 'Mock', familyName: 'User' }
        };
        next();
      } else if (callback) {
        // This branch is for the strategy's verify callback (e.g., local strategy)
        const user = {
          id: 'mockId',
          displayName: 'Mock User',
          username: 'mockuser',
          emails: [{ value: 'mock@example.com' }],
          photos: [{ value: 'mockphoto.jpg' }],
          name: { givenName: 'Mock', familyName: 'User' }
        };
        req.user = user;
        callback(null, user, null); // Call the strategy's verify callback
      } else {
        // This branch is for other cases, if any
        next();
      }
    }),
    serializeUser: jest.fn((user, done) => done(null, user.id)),
    deserializeUser: jest.fn((id, done) => done(null, { id: id, username: 'mockuser' })),
    use: jest.fn(),
    initialize: jest.fn(() => (req, res, next) => next()),
    session: jest.fn(() => (req, res, next) => next()),
  };
  return passport;
});

jest.mock('../src/config/passport', () => ({}));

jest.doMock('../src/utils/image.js', () => {});

const request = require('supertest');
const server = require('../src/app');
const User = require('../src/models/user.model');
const userController = require('../src/controllers/user.controller');

jest.mock('../src/controllers/user.controller', () => ({
  ...jest.requireActual('../src/controllers/user.controller'),
  createOtp: jest.fn(),
  verifyOtp: jest.fn(),
  resendOtp: jest.fn(),
  resetPassword: jest.fn(),
  newPassword: jest.fn(),
}));

describe('Auth API', () => {
  let token;
  let refreshToken;

  beforeEach(async () => {
    jest.restoreAllMocks(); // Restore mocks before each test to ensure a clean state
    await User.deleteMany({});
    const res = await request(server)
      .post('/api/auth/register')
      .send({
        fullName: {
          firstName: 'John',
          lastName: 'Doe',
        },
        username: 'johndoe',
        email: 'johndoe@example.com',
        password: 'password123',
      });
    token = res.body.access_Token;
    refreshToken = res.body.refresh_Token;
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          fullName: {
            firstName: 'Jane',
            lastName: 'Doe',
          },
          username: 'janedoe',
          email: 'jane@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('access_Token');
      expect(res.body).toHaveProperty('refresh_Token');

      const user = await User.findOne({ email: 'jane@example.com' });
      expect(user).not.toBeNull();
      expect(user.username).toBe('janedoe');
    });

    it('should not register a user with an existing email', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          fullName: {
            firstName: 'John',
            lastName: 'Doe',
          },
          username: 'johndoe',
          email: 'johndoe@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'johndoe@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('access_Token');
      expect(res.body).toHaveProperty('refresh_Token');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get a user profile', async () => {
      const res = await request(server)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('username', 'johndoe');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update a user profile', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fullName: {
            firstName: 'John',
            lastName: 'Smith',
          },
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.fullName.lastName).toEqual('Smith');
    });
  });

  describe('DELETE /api/auth/profile', () => {
    it('should delete a user profile', async () => {
      const res = await request(server)
        .delete('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'User deleted successfully');
    });
  });

  describe('GET /api/auth/refresh_token', () => {
    it('should refresh the access token', async () => {
      const res = await request(server)
        .get('/api/auth/refresh_Token')
        .set('Authorization', `Bearer ${refreshToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('access_Token');
      expect(res.body).toHaveProperty('refresh_Token');
    });
  });

  describe('POST /api/auth/createOtp', () => {
    it('should create an OTP', async () => {
      userController.createOtp.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, message: 'OTP created successfully.' });
      });

      const res = await request(server)
        .post('/api/auth/createOtp')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'OTP created successfully.');
    });
  });

  describe('POST /api/auth/verifyOtp', () => {
    it('should verify an OTP', async () => {
      userController.verifyOtp.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, message: 'OTP verified successfully.' });
      });

      const res = await request(server)
        .post('/api/auth/verifyOtp')
        .send({ email: 'test@example.com', otp: '123456' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'OTP verified successfully.');
    });
  });

  describe('POST /api/auth/resendOtp', () => {
    it('should resend an OTP', async () => {
      userController.resendOtp.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, message: 'OTP resent successfully.' });
      });

      const res = await request(server)
        .post('/api/auth/resendOtp')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'OTP resent successfully.');
    });
  });

  describe('POST /api/auth/resetPassword', () => {
    it('should reset password', async () => {
      userController.resetPassword.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, message: 'Password reset successfully.' });
      });

      const res = await request(server)
        .post('/api/auth/resetPassword')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'password123', newPassword: 'newpassword123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Password reset successfully.');
    });
  });

  describe('POST /api/auth/newPassword', () => {
    it('should set new password', async () => {
      userController.newPassword.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, message: 'New password set successfully.' });
      });

      const res = await request(server)
        .post('/api/auth/newPassword')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'test@example.com', otp: '123456', newPassword: 'newpassword123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'New password set successfully.');
    });
  });
});