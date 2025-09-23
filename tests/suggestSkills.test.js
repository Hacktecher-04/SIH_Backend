
jest.mock('../src/config/passport');
jest.mock('../src/services/researchCareer.service.js');
const request = require('supertest');
const server = require('../src/app');
const User = require('../src/models/user.model');
const SuggestSkills = require('../src/models/suggestSkills.model');
const researchCareerService = require('../src/services/researchCareer.service.js');

describe('Suggest Skills API', () => {
  let token;
  let userId;

  beforeEach(async () => {
    await User.deleteMany({});
    await SuggestSkills.deleteMany({});
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

  describe('POST /api/suggestSkills/create', () => {
    it('should create a new suggestion', async () => {
      const suggestionData = { title: 't', foundational_skills: { description: 'd' }, rising_stars: { description: 'd' } };
      researchCareerService.generateSuggestSkills.mockResolvedValue(suggestionData);

      const res = await request(server)
        .post('/api/suggestSkills/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ industry: 'Frontend Developer' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('GET /api/suggestSkills/:id', () => {
    it('should get a single suggestion', async () => {
      const suggestion = await SuggestSkills.create({ userId, title: 't', foundational_skills: { description: 'd' }, rising_stars: { description: 'd' } });

      const res = await request(server)
        .get(`/api/suggestSkills/${suggestion._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
    });
  });

  describe('DELETE /api/suggestSkills/:id', () => {
    it('should delete a suggestion', async () => {
      const suggestion = await SuggestSkills.create({ userId, title: 't', foundational_skills: { description: 'd' }, rising_stars: { description: 'd' } });

      const res = await request(server)
        .delete(`/api/suggestSkills/${suggestion._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Research Career deleted successfully!');
    });
  });
});
