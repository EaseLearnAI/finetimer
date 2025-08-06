'use strict';

const request = require('supertest');
const app = require('../src/app');

// 测试API接口
describe('API Tests', () => {
  // 测试根路径
  it('should return welcome message on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('欢迎使用AIsiri后端API');
  });

  // 测试番茄钟路由
  it('should return 404 on GET /api/pomodoro/nonexistent', async () => {
    const res = await request(app).get('/api/pomodoro/nonexistent');
    expect(res.status).toBe(404);
  });

  // 测试任务路由
  it('should return 404 on GET /api/tasks/nonexistent', async () => {
    const res = await request(app).get('/api/tasks/nonexistent');
    expect(res.status).toBe(404);
  });

  // 测试任务集路由
  it('should return 404 on GET /api/collections/nonexistent', async () => {
    const res = await request(app).get('/api/collections/nonexistent');
    expect(res.status).toBe(404);
  });
});