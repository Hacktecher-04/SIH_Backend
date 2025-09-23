jest.mock('../src/config/passport');

jest.doMock('../src/utils/image.js', () => {});
jest.mock('../src/services/roadmap.service.js'); // Changed from aiRoadmap.service.js
jest.mock('../src/helpers/googleSearch.js');
const request = require('supertest');
const server = require('../src/app');
const User = require('../src/models/user.model');
const Roadmap = require('../src/models/roadmap.model');
const roadmapService = require('../src/services/roadmap.service.js'); // Changed from aiRoadmap.service.js
const passport = require('passport');

describe('AI Roadmap API', () => {
  let token;
  let userId;

  beforeEach(async () => {
    jest.spyOn(passport, 'serializeUser').mockImplementation((user, done) => {
      done(null, user.id);
    });
    jest.spyOn(passport, 'deserializeUser').mockImplementation((id, done) => {
      done(null, { id: id, username: 'mockuser' });
    });

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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/aiRoadmap/create', () => {
    it('should create a new roadmap', async () => {
      const roadmapData = { _id: 'mockRoadmapId', title: 'Test Roadmap', description: 'Test Description', sections: [] };
      roadmapService.createRoadmap = jest.fn().mockResolvedValue(roadmapData); // Changed from aiRoadmapService.generateRoadmap

      const res = await request(server)
        .post('/api/aiRoadmap/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ goal: 'test goal', level: 'beginner', pace: 'normal' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('activeRoadmapId', 'mockRoadmapId');
    });
  });

  describe('GET /api/aiRoadmap/get', () => {
    it('should get all user roadmaps', async () => {
      roadmapService.getUserRoadmaps = jest.fn().mockResolvedValue([{ userId, title: 'Test Roadmap', description: 'Test Description', sections: [], inputGoal: 'g', inputLevel: 'l', inputPace: 'p' }]);

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

      roadmapService.getRoadmapById = jest.fn().mockResolvedValue(roadmap); // Mocking getRoadmapById

      const res = await request(server)
        .get(`/api/aiRoadmap/${roadmap._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.title).toBe('Test Roadmap');
    });

    it('should return 404 for a non-existent roadmap', async () => {
      roadmapService.getRoadmapById = jest.fn().mockResolvedValue(null); // Mocking getRoadmapById to return null

      const res = await request(server)
        .get(`/api/aiRoadmap/60f7b3b3b3b3b3b3b3b3b3b3`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('DELETE /api/aiRoadmap/:id', () => {
    it('should delete a roadmap', async () => {
      const roadmap = await Roadmap.create({ userId, title: 'Test Roadmap', description: 'Test Description', sections: [], inputGoal: 'g', inputLevel: 'l', inputPace: 'p' });

      roadmapService.deleteRoadmap = jest.fn().mockResolvedValue(true); // Mocking deleteRoadmap

      const res = await request(server)
        .delete(`/api/aiRoadmap/${roadmap._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Roadmap deleted successfully.');
    });
  });
});