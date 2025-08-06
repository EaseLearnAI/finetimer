'use strict';

const request = require('supertest');
const express = require('express');
const aiRoutes = require('../routes/ai_routes');

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);

describe('AI服务API测试', () => {
  
  // 测试健康检查
  describe('GET /api/ai/health', () => {
    test('应该返回健康状态', async () => {
      const response = await request(app)
        .get('/api/ai/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  // 测试AI连接
  describe('GET /api/ai/test-connection', () => {
    test('应该测试AI连接状态', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
      
      if (response.body.success) {
        expect(response.body).toHaveProperty('model');
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(503);
      }
    }, 30000); // 30秒超时
  });

  // 测试系统状态
  describe('GET /api/ai/status', () => {
    test('应该返回系统状态信息', async () => {
      const response = await request(app)
        .get('/api/ai/status')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toHaveProperty('ai_service');
      expect(response.body.status).toHaveProperty('available_chains');
      expect(response.body.status).toHaveProperty('prompt_templates');
      expect(response.body.status).toHaveProperty('model_info');
    });
  });

  // 测试输入分类
  describe('POST /api/ai/classify-input', () => {
    test('应该正确分类简单待办', async () => {
      const response = await request(app)
        .post('/api/ai/classify-input')
        .send({
          userInput: '取个外卖'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('classification');
      expect(response.body.classification).toHaveProperty('category');
      expect(response.body.classification).toHaveProperty('confidence');
    }, 15000);

    test('应该正确分类目标规划', async () => {
      const response = await request(app)
        .post('/api/ai/classify-input')
        .send({
          userInput: '我想学会Python编程'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.classification).toHaveProperty('category');
    }, 15000);

    test('应该正确分类习惯养成', async () => {
      const response = await request(app)
        .post('/api/ai/classify-input')
        .send({
          userInput: '每天跑步30分钟'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.classification).toHaveProperty('category');
    }, 15000);

    test('缺少参数时应该返回错误', async () => {
      const response = await request(app)
        .post('/api/ai/classify-input')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  // 测试问题生成
  describe('POST /api/ai/generate-questions', () => {
    test('应该为目标规划生成问题', async () => {
      const response = await request(app)
        .post('/api/ai/generate-questions')
        .send({
          goal: '考研英语',
          goalType: 'goal_planning'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions).toHaveProperty('questions');
      expect(Array.isArray(response.body.questions.questions)).toBe(true);
      expect(response.body.questions.questions.length).toBeGreaterThan(0);
    }, 15000);

    test('应该为习惯养成生成问题', async () => {
      const response = await request(app)
        .post('/api/ai/generate-questions')
        .send({
          goal: '每天阅读',
          goalType: 'habit_formation'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('questions');
    }, 15000);

    test('缺少参数时应该返回错误', async () => {
      const response = await request(app)
        .post('/api/ai/generate-questions')
        .send({
          goal: '学习'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  // 测试主要流程
  describe('POST /api/ai/process-input', () => {
    test('应该处理简单待办输入', async () => {
      const response = await request(app)
        .post('/api/ai/process-input')
        .send({
          userInput: '买菜',
          userId: 'test-user-123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('classification');
      expect(response.body).toHaveProperty('result');
    }, 20000);

    test('应该处理目标规划输入', async () => {
      const response = await request(app)
        .post('/api/ai/process-input')
        .send({
          userInput: '我想准备公务员考试',
          userId: 'test-user-123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('type', 'goal_planning');
      expect(response.body.result).toHaveProperty('questions');
      expect(response.body.result).toHaveProperty('next_step', 'collect_answers');
    }, 20000);

    test('应该处理习惯养成输入', async () => {
      const response = await request(app)
        .post('/api/ai/process-input')
        .send({
          userInput: '每天早起',
          userId: 'test-user-123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('type');
    }, 20000);

    test('缺少输入时应该返回错误', async () => {
      const response = await request(app)
        .post('/api/ai/process-input')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  // 测试计划生成
  describe('POST /api/ai/generate-plan', () => {
    test('应该根据回答生成计划', async () => {
      const response = await request(app)
        .post('/api/ai/generate-plan')
        .send({
          goal: '学习JavaScript',
          goalType: 'goal_planning',
          userAnswers: [
            '3个月内完成',
            '有一些HTML基础',
            '每天2小时',
            '主要是坚持和理解复杂概念'
          ],
          userId: 'test-user-123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('type', 'plan_generated');
      expect(response.body.result).toHaveProperty('plan');
      expect(response.body.result).toHaveProperty('message');
    }, 30000);

    test('缺少参数时应该返回错误', async () => {
      const response = await request(app)
        .post('/api/ai/generate-plan')
        .send({
          goal: '学习编程'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  // 测试404路由
  describe('不存在的路由', () => {
    test('应该返回404错误', async () => {
      const response = await request(app)
        .get('/api/ai/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('available_routes');
    });
  });
});

module.exports = app;