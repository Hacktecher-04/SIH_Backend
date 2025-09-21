jest.mock('../src/config/passport');

jest.doMock('../src/utils/image.js', () => {});

const passport = require('passport');
jest.mock('passport', () => {
  const passport = {
    authenticate: jest.fn((strategy, options, callback) => (req, res, next) => {
      if (callback) {
        // This branch is for the strategy's verify callback
        const user = {
          id: 'mockId',
          displayName: 'Mock User',
          username: 'mockuser',
          emails: [{ value: 'mock@example.com' }],
          photos: [{ value: 'mockphoto.jpg' }],
          name: { givenName: 'Mock', familyName: 'User' }
        };
        // Simulate a successful authentication by attaching user to req.user
        req.user = user;
        callback(null, user, null); // Call the strategy's verify callback
      } else {
        // This branch is for the initial redirect
        // Simulate a redirect to the OAuth provider
        res.redirect(302, `http://mock-oauth-provider.com/login?client_id=${options.clientID}&redirect_uri=${options.callbackURL}`);
      }
      next(); // Ensure next middleware is called for both cases
    }),
    serializeUser: jest.fn((user, done) => done(null, user.id)),
    deserializeUser: jest.fn((id, done) => done(null, { id: id, username: 'mockuser' })),
    use: jest.fn(), // Add a mock for .use()
    initialize: jest.fn(() => (req, res, next) => next()), // Add mock for initialize
    session: jest.fn(() => (req, res, next) => next()),    // Add mock for session
  };
  return passport;
});

const request = require('supertest');
const server = require('../src/app');
const User = require('../src/models/user.model');


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
});