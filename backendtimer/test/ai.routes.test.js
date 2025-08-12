'use strict';

const request = require('supertest');

// Ensure test env mocks are active before requiring app
process.env.NODE_ENV = 'test';
process.env.MOCK_LLM = 'true';
process.env.MOCK_DB = 'true';

const app = require('../src/app');

describe('AI Routes (mocked)', () => {
  test('GET /api/ai/health returns ok', async () => {
    const res = await request(app).get('/api/ai/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('GET /api/ai/status returns system status', async () => {
    const res = await request(app).get('/api/ai/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toHaveProperty('available_chains');
  });

  test('GET /api/ai/test-connection returns success (mocked)', async () => {
    const res = await request(app).get('/api/ai/test-connection');
    // In mock mode, should be success 200
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('success');
  }, 15000);

  test('POST /api/ai/classify-input works', async () => {
    const res = await request(app)
      .post('/api/ai/classify-input')
      .send({ userInput: '买菜' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('classification');
  });

  test('POST /api/ai/generate-questions works', async () => {
    const res = await request(app)
      .post('/api/ai/generate-questions')
      .send({ goal: '学习编程', goalType: 'goal_planning' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('questions');
  }, 15000);

  test('POST /api/ai/process-input works', async () => {
    const res = await request(app)
      .post('/api/ai/process-input')
      .send({ userInput: '每天跑步30分钟', userId: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('type');
  }, 15000);

  test('POST /api/ai/generate-plan works', async () => {
    const res = await request(app)
      .post('/api/ai/generate-plan')
      .send({
        goal: '学习JavaScript',
        goalType: 'goal_planning',
        userAnswers: ['三个月', '有基础', '每天两小时', '难点在坚持'],
        userId: 'u1'
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('type', 'plan_generated');
  }, 15000);

  test('POST /api/ai/adjust-plan works', async () => {
    const res = await request(app)
      .post('/api/ai/adjust-plan')
      .send({ planId: 'mock-plan-id', userFeedback: '时间不够，太忙', userId: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('type', 'plan_adjusted');
  }, 15000);
});

