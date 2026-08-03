process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/database/connection');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');

describe('API integration without external database', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('GET /api/health trả response thống nhất', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { status: 'healthy' } });
  });

  test('endpoint không tồn tại trả 404', async () => {
    const response = await request(app).get('/api/not-real');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test('đăng ký dữ liệu sai trả 422 tiếng Việt', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'khong-phai-email',
      phone: '12',
      fullName: '',
      role: 'admin',
      password: 'abc',
    });
    expect(response.status).toBe(422);
    expect(response.body.message).toBe('Dữ liệu không hợp lệ');
    expect(response.body.errors.length).toBeGreaterThan(3);
  });

  test('đăng nhập dữ liệu sai trả 422', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'bad', password: '' });
    expect(response.status).toBe(422);
  });

  test('tạo phòng chưa đăng nhập trả 401', async () => {
    const response = await request(app).post('/api/rooms').send({});
    expect(response.status).toBe(401);
  });

  test('yêu thích chưa đăng nhập trả 401', async () => {
    const response = await request(app).get('/api/favorites');
    expect(response.status).toBe(401);
  });

  test('conversation chưa đăng nhập trả 401', async () => {
    const response = await request(app).get('/api/conversations');
    expect(response.status).toBe(401);
  });

  test('token Web PubSub chưa đăng nhập trả 401', async () => {
    const response = await request(app)
      .get('/api/conversations/11111111-1111-4111-8111-111111111111/pubsub-token');
    expect(response.status).toBe(401);
  });

  test('token Web PubSub trả 403 cho user ngoài conversation', async () => {
    const userId = '22222222-2222-4222-8222-222222222222';
    const conversationId = '11111111-1111-4111-8111-111111111111';
    const token = jwt.sign({ sub: userId }, env.jwtSecret);
    const query = jest.spyOn(pool, 'query')
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: userId, email: 'test@example.com', full_name: 'Test', role: 'tenant', status: 'active' }],
      })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const response = await request(app)
      .get(`/api/conversations/${conversationId}/pubsub-token`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(query).toHaveBeenCalledTimes(2);
    query.mockRestore();
  });

  test('admin chưa đăng nhập trả 401', async () => {
    const response = await request(app).get('/api/admin/dashboard');
    expect(response.status).toBe(401);
  });

  test('Swagger UI mở được', async () => {
    const response = await request(app).get('/api/docs/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Swagger UI');
  });

  test('frontend SPA mở được', async () => {
    const response = await request(app).get('/rooms');
    expect(response.status).toBe(200);
    expect(response.text).toContain('SmartRoomie');
  });
});

