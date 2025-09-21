
require('dotenv').config({ path: './.env' }); // Add this line at the top

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
require('jest-fetch-mock').enableMocks();

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri);
  process.env.IMAGEKIT_PUBLIC_KEY = 'your_public_key';
  process.env.IMAGEKIT_PRIVATE_KEY = 'your_private_key';
  process.env.IMAGEKIT_URL_ENDPOINT = 'your_url_endpoint';
  process.env.JWT_SECRET = 'test_secret';
  process.env.JWT_EXPIRY = '1d';
  process.env.REFRESH_JWT_SECRET = 'test_refresh_secret';
  process.env.REFRESH_JWT_EXPIRY = '7d';

});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
