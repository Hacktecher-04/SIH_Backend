jest.doMock('../src/utils/image.js', () => {});
jest.mock('../src/services/ai.service.js');
const request = require('supertest');
const server = require('../src/app');
const User = require('../src/models/user.model');
const AiModel = require('../src/models/ai.model');
const aiService = require('../src/services/ai.service.js');

describe('AI API', () => {
  let token;

  beforeEach(async () => {
    await User.deleteMany({});
    await AiModel.deleteMany({});
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
  });

  describe('POST /api/ai/create', () => {
    it('should create a new AI message', async () => {
      aiService.mockResolvedValue('This is a test response');
      const res = await request(server)
        .post('/api/ai/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'test prompt' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual('This is a test response');
    });
  });

  describe('GET /api/ai/get', () => {
    it('should get and clean messages', async () => {
      await AiModel.create([
        { userId: '1', prompt: 'p1', response: 'r1' },
        { userId: '2', prompt: 'p2', response: 'r2' },
      ]);

      const res = await request(server)
        .get('/api/ai/get')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBe(2);
    });
  });
});