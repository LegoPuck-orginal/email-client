process.env.NODE_ENV = 'test';
process.env.DB_PATH = `/tmp/email-client-health-test-${Date.now()}.db`;
process.env.JWT_SECRET = 'test-secret-health';

const request = require('supertest');
const app = require('../server');
const { sequelize } = require('../models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /api/health', () => {
  it('responds 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('GET /api/unknown-route', () => {
  it('responds 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.statusCode).toBe(404);
  });
});
