jest.mock('../src/config/passport');

jest.doMock('../src/utils/image.js', () => {});
jest.mock('../src/services/aiRoadmap.service.js');
jest.mock('../src/helpers/googleSearch.js');
const passport = require('passport');
jest.mock('passport', () => {
  const passport = {
    authenticate: jest.fn((strategy, options, callback) => (req, res, next) => {
      if (callback) {
        const user = {
          id: 'mockId',
          displayName: 'Mock User',
          username: 'mockuser',
          emails: [{ value: 'mock@example.com' }],
          photos: [{ value: 'mockphoto.jpg' }],
          name: { givenName: 'Mock', familyName: 'User' }
        };
        req.user = user;
        callback(null, user, null);
      } else {
        res.redirect(302, `http://mock-oauth-provider.com/login?client_id=${options.clientID}&redirect_uri=${options.callbackURL}`);
      }
      next();
    }),
    serializeUser: jest.fn((user, done) => done(null, user.id)),
    deserializeUser: jest.fn((id, done) => done(null, { id: id, username: 'mockuser' })),
    use: jest.fn(),
    initialize: jest.fn(() => (req, res, next) => next()),
    session: jest.fn(() => (req, res, next) => next()),
  };
  return passport;
});
const request = require('supertest');
const server = require('../src/app');
const User = require('../src/models/user.model');
const Roadmap = require('../src/models/roadmap.model');
const aiRoadmapService = require('../src/services/aiRoadmap.service.js');

describe('AI Roadmap API', () => {
  let token;
  let userId;

  beforeEach(async () => {
    await User.deleteMany({});
    await Roadmap.deleteMany({});
    const userRes = await request(server)
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
    token = userRes.body.access_Token;
    const user = await User.findOne({ email: 'johndoe@example.com' });
    userId = user._id;
  });

  describe('POST /api/aiRoadmap/create', () => {
    it('should create a new roadmap', async () => {
      const roadmapData = { title: 'Test Roadmap', description: 'Test Description', sections: [] };
      aiRoadmapService.mockResolvedValue(roadmapData);

      const res = await request(server)
        .post('/api/aiRoadmap/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ goal: 'test goal', level: 'beginner', pace: 'normal' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('activeRoadmapId');
    });
  });

  describe('GET /api/aiRoadmap/get', () => {
    it('should get all user roadmaps', async () => {
      await Roadmap.create({ userId, title: 'Test Roadmap', description: 'Test Description', sections: [], inputGoal: 'g', inputLevel: 'l', inputPace: 'p' });

      const res = await request(server)
        .get('/api/aiRoadmap/get')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.roadmaps.length).toBe(1);
    });
  });

  describe('GET /api/aiRoadmap/:id', () => {
    it('should get a single roadmap', async () => {
      const roadmap = await Roadmap.create({ userId, title: 'Test Roadmap', description: 'Test Description', sections: [], inputGoal: 'g', inputLevel: 'l', inputPace: 'p' });

      const res = await request(server)
        .get(`/api/aiRoadmap/${roadmap._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.title).toBe('Test Roadmap');
    });
  });

  describe('DELETE /api/aiRoadmap/:id', () => {
    it('should delete a roadmap', async () => {
      const roadmap = await Roadmap.create({ userId, title: 'Test Roadmap', description: 'Test Description', sections: [], inputGoal: 'g', inputLevel: 'l', inputPace: 'p' });

      const res = await request(server)
        .delete(`/api/aiRoadmap/${roadmap._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Roadmap deleted successfully.');
    });
  });
});