'use strict';

const request = require('supertest');
const app = require('../src/app');

// 集成测试
describe('Integration Tests', () => {
  let createdTaskId;
  let createdCollectionId;
  let createdPomodoroId;

  // 测试任务集API
  describe('Collection API', () => {
    it('should create a new collection', async () => {
      const res = await request(app)
        .post('/api/collections')
        .send({
          name: '测试任务集',
          description: '这是一个测试任务集'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('测试任务集');
      createdCollectionId = res.body.data._id;
    });

    it('should get all collections', async () => {
      const res = await request(app).get('/api/collections');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get a collection by id', async () => {
      const res = await request(app).get(`/api/collections/${createdCollectionId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(createdCollectionId);
    });

    it('should update a collection', async () => {
      const res = await request(app)
        .put(`/api/collections/${createdCollectionId}`)
        .send({
          name: '更新后的任务集'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('更新后的任务集');
    });
  });

  // 测试任务API
  describe('Task API', () => {
    it('should create a new task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: '测试任务',
          description: '这是一个测试任务',
          priority: 'high',
          collectionId: createdCollectionId
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('测试任务');
      createdTaskId = res.body.data._id;
    });

    it('should get all tasks', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get a task by id', async () => {
      const res = await request(app).get(`/api/tasks/${createdTaskId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(createdTaskId);
    });

    it('should update a task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${createdTaskId}`)
        .send({
          title: '更新后的任务'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('更新后的任务');
    });

    it('should toggle task completion', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${createdTaskId}/toggle`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completed).toBe(true);
    });
  });

  // 测试番茄钟API
  describe('Pomodoro API', () => {
    it('should create a new pomodoro record', async () => {
      const res = await request(app)
        .post('/api/pomodoro')
        .send({
          taskName: '测试番茄钟任务',
          mode: 'pomodoro',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 25 * 60000).toISOString(),
          duration: 25 * 60
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.taskName).toBe('测试番茄钟任务');
      createdPomodoroId = res.body.data._id;
    });

    it('should get all pomodoro records', async () => {
      const res = await request(app).get('/api/pomodoro');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get a pomodoro record by id', async () => {
      const res = await request(app).get(`/api/pomodoro/${createdPomodoroId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(createdPomodoroId);
    });

    it('should update a pomodoro record', async () => {
      const res = await request(app)
        .put(`/api/pomodoro/${createdPomodoroId}`)
        .send({
          taskName: '更新后的番茄钟任务'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.taskName).toBe('更新后的番茄钟任务');
    });
  });

  // 清理测试数据
  afterAll(async () => {
    // 删除测试数据
    if (createdPomodoroId) {
      await request(app).delete(`/api/pomodoro/${createdPomodoroId}`);
    }
    
    if (createdTaskId) {
      await request(app).delete(`/api/tasks/${createdTaskId}`);
    }
    
    if (createdCollectionId) {
      await request(app).delete(`/api/collections/${createdCollectionId}`);
    }
  });
});