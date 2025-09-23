jest.mock('../src/config/passport');
jest.mock('../src/services/researchCareer.service.js');
const request = require('supertest');
const server = require('../src/app');
const User = require('../src/models/user.model');
const ResearchCareer = require('../src/models/researchCareer.model');
const researchCareerService = require('../src/services/researchCareer.service.js');

describe('Research Career API', () => {
  let token;
  let userId;

  beforeEach(async () => {
    await User.deleteMany({});
    await ResearchCareer.deleteMany({});
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

  describe('POST /api/researchCareer/create', () => {
    it('should create a new research career', async () => {
      const researchData = { career_title: 'Test Research', description: 'Test Description', deep_dive_url: 'url', icon: 'icon' };
      researchCareerService.generateContentFromAI = jest.fn().mockResolvedValue(researchData);

      const res = await request(server)
        .post('/api/researchCareer/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ careerName: 'test career' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('GET /api/researchCareer/get', () => {
    it('should get all user research careers', async () => {
      await ResearchCareer.create({ userId, career_title: 'Test Research', description: 'Test Description', deep_dive_url: 'url', icon: 'icon' });

      const res = await request(server)
        .get('/api/researchCareer/get')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/researchCareer/:id', () => {
    it('should get a single research career', async () => {
      const research = await ResearchCareer.create({ userId, career_title: 'Test Research', description: 'Test Description', deep_dive_url: 'url', icon: 'icon' });

      const res = await request(server)
        .get(`/api/researchCareer/${research._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.career_title).toBe('Test Research');
    });
  });

  describe('DELETE /api/researchCareer/:id', () => {
    it('should delete a research career', async () => {
      const research = await ResearchCareer.create({ userId, career_title: 'Test Research', description: 'Test Description', deep_dive_url: 'url', icon: 'icon' });

      const res = await request(server)
        .delete(`/api/researchCareer/${research._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Research Career deleted successfully!');
    });
  });
});