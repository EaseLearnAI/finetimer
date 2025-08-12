'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Task = require('../src/models/Task');
const Collection = require('../src/models/Collection');
const Pomodoro = require('../src/models/Pomodoro');

// 测试数据
const testUsers = [
  {
    phoneNumber: '13800138001',
    password: '123456',
    nickname: '测试用户1'
  },
  {
    phoneNumber: '13800138002',
    password: '123456',
    nickname: '测试用户2'
  }
];

let user1Token = '';
let user2Token = '';
let user1Id = '';
let user2Id = '';

describe('用户认证和数据隔离API测试', () => {
  beforeAll(async () => {
    // 连接测试数据库
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/aisiri_test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
    
    console.log('\n=== 开始用户认证和数据隔离API测试 ===');
  });

  afterAll(async () => {
    // 清理测试数据
    await User.deleteMany({});
    await Task.deleteMany({});
    await Collection.deleteMany({});
    await Pomodoro.deleteMany({});
    
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n=== 测试完成，数据库已清理 ===\n');
  });

  describe('1. 用户注册测试', () => {
    test('1.1 正常注册第一个用户', async () => {
      console.log('\n📝 测试用户注册...');
      
      const response = await request(app)
        .post('/api/users/register')
        .send(testUsers[0])
        .expect(201);

      console.log(`✅ 用户注册成功: ${response.body.data.user.nickname}`);
      console.log(`📱 手机号: ${response.body.data.user.phoneNumber}`);
      console.log(`🆔 用户ID: ${response.body.data.user.id}`);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.phoneNumber).toBe(testUsers[0].phoneNumber);
      expect(response.body.data.token).toBeDefined();
      
      user1Token = response.body.data.token;
      user1Id = response.body.data.user.id;
    });

    test('1.2 正常注册第二个用户', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(testUsers[1])
        .expect(201);

      console.log(`✅ 用户注册成功: ${response.body.data.user.nickname}`);
      console.log(`📱 手机号: ${response.body.data.user.phoneNumber}`);
      console.log(`🆔 用户ID: ${response.body.data.user.id}`);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.phoneNumber).toBe(testUsers[1].phoneNumber);
      expect(response.body.data.token).toBeDefined();
      
      user2Token = response.body.data.token;
      user2Id = response.body.data.user.id;
    });

    test('1.3 重复手机号注册失败', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(testUsers[0])
        .expect(409);

      console.log(`❌ 重复手机号注册被拒绝: ${response.body.message}`);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('已注册');
    });

    test('1.4 无效手机号注册失败', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          phoneNumber: '123',
          password: '123456'
        })
        .expect(400);

      console.log(`❌ 无效手机号注册被拒绝: ${response.body.message}`);
      expect(response.body.success).toBe(false);
    });
  });

  describe('2. 用户登录测试', () => {
    test('2.1 正确密码登录成功', async () => {
      console.log('\n🔐 测试用户登录...');
      
      const response = await request(app)
        .post('/api/users/login')
        .send({
          phoneNumber: testUsers[0].phoneNumber,
          password: testUsers[0].password
        })
        .expect(200);

      console.log(`✅ 用户登录成功: ${response.body.data.user.nickname}`);
      console.log(`⏰ 最后登录时间: ${response.body.data.user.lastLoginAt}`);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test('2.2 错误密码登录失败', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          phoneNumber: testUsers[0].phoneNumber,
          password: 'wrongpassword'
        })
        .expect(401);

      console.log(`❌ 错误密码登录被拒绝: ${response.body.message}`);
      expect(response.body.success).toBe(false);
    });

    test('2.3 不存在的用户登录失败', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          phoneNumber: '19999999999',
          password: '123456'
        })
        .expect(401);

      console.log(`❌ 不存在用户登录被拒绝: ${response.body.message}`);
      expect(response.body.success).toBe(false);
    });
  });

  describe('3. 认证中间件测试', () => {
    test('3.1 无token访问受保护资源失败', async () => {
      console.log('\n🛡️ 测试认证中间件...');
      
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      console.log(`❌ 无token访问被拒绝: ${response.body.message}`);
      expect(response.body.success).toBe(false);
    });

    test('3.2 有效token访问用户信息成功', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      console.log(`✅ 用户信息获取成功: ${response.body.data.user.nickname}`);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user1Id);
    });

    test('3.3 无效token访问失败', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      console.log(`❌ 无效token访问被拒绝: ${response.body.message}`);
      expect(response.body.success).toBe(false);
    });
  });

  describe('4. 数据隔离测试 - 任务集', () => {
    let user1CollectionId = '';
    let user2CollectionId = '';

    test('4.1 用户1创建任务集', async () => {
      console.log('\n📂 测试任务集数据隔离...');
      
      const response = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: '用户1的工作任务',
          description: '这是用户1的任务集'
        })
        .expect(201);

      console.log(`✅ 用户1创建任务集: ${response.body.data.name}`);
      user1CollectionId = response.body.data._id;
      expect(response.body.success).toBe(true);
    });

    test('4.2 用户2创建任务集', async () => {
      const response = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: '用户2的学习任务',
          description: '这是用户2的任务集'
        })
        .expect(201);

      console.log(`✅ 用户2创建任务集: ${response.body.data.name}`);
      user2CollectionId = response.body.data._id;
      expect(response.body.success).toBe(true);
    });

    test('4.3 用户1只能看到自己的任务集', async () => {
      const response = await request(app)
        .get('/api/collections')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      console.log(`✅ 用户1查看任务集数量: ${response.body.data.length}`);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // 检查所有任务集都属于用户1
      response.body.data.forEach(collection => {
        expect(collection.name).not.toContain('用户2');
      });
    });

    test('4.4 用户2只能看到自己的任务集', async () => {
      const response = await request(app)
        .get('/api/collections')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      console.log(`✅ 用户2查看任务集数量: ${response.body.data.length}`);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // 检查所有任务集都属于用户2
      response.body.data.forEach(collection => {
        expect(collection.name).not.toContain('用户1');
      });
    });

    test('4.5 用户不能访问其他用户的任务集', async () => {
      const response = await request(app)
        .get(`/api/collections/${user2CollectionId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      console.log(`❌ 用户1无法访问用户2的任务集: ${response.body.message}`);
      expect(response.body.success).toBe(false);
    });
  });

  describe('5. 数据隔离测试 - 任务', () => {
    let user1TaskId = '';
    let user2TaskId = '';

    test('5.1 用户1创建任务', async () => {
      console.log('\n📝 测试任务数据隔离...');
      
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: '用户1的重要任务',
          description: '这是用户1的任务',
          priority: 'high',
          quadrant: 1
        })
        .expect(201);

      console.log(`✅ 用户1创建任务: ${response.body.data.title}`);
      user1TaskId = response.body.data._id;
      expect(response.body.success).toBe(true);
    });

    test('5.2 用户2创建任务', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: '用户2的学习任务',
          description: '这是用户2的任务',
          priority: 'medium',
          quadrant: 2
        })
        .expect(201);

      console.log(`✅ 用户2创建任务: ${response.body.data.title}`);
      user2TaskId = response.body.data._id;
      expect(response.body.success).toBe(true);
    });

    test('5.3 用户1只能看到自己的任务', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      console.log(`✅ 用户1查看任务数量: ${response.body.data.length}`);
      expect(response.body.success).toBe(true);
      
      // 检查所有任务都属于用户1
      response.body.data.forEach(task => {
        expect(task.title).not.toContain('用户2');
      });
    });

    test('5.4 用户不能访问其他用户的任务', async () => {
      const response = await request(app)
        .get(`/api/tasks/${user2TaskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      console.log(`❌ 用户1无法访问用户2的任务: ${response.body.message}`);
      expect(response.body.success).toBe(false);
    });
  });

  describe('6. 数据隔离测试 - 番茄钟', () => {
    test('6.1 用户1创建番茄钟记录', async () => {
      console.log('\n🍅 测试番茄钟数据隔离...');
      
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 25 * 60 * 1000); // 25分钟后
      
      const response = await request(app)
        .post('/api/pomodoro')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          taskName: '用户1的专注任务',
          mode: 'pomodoro',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: 1500, // 25分钟
          completed: true
        })
        .expect(201);

      console.log(`✅ 用户1创建番茄钟记录: ${response.body.data.taskName}`);
      expect(response.body.success).toBe(true);
    });

    test('6.2 用户2创建番茄钟记录', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 25 * 60 * 1000);
      
      const response = await request(app)
        .post('/api/pomodoro')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          taskName: '用户2的学习任务',
          mode: 'pomodoro',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: 1500,
          completed: true
        })
        .expect(201);

      console.log(`✅ 用户2创建番茄钟记录: ${response.body.data.taskName}`);
      expect(response.body.success).toBe(true);
    });

    test('6.3 用户1只能看到自己的番茄钟记录', async () => {
      const response = await request(app)
        .get('/api/pomodoro')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      console.log(`✅ 用户1查看番茄钟记录数量: ${response.body.data.length}`);
      expect(response.body.success).toBe(true);
      
      // 检查所有记录都属于用户1
      response.body.data.forEach(pomodoro => {
        expect(pomodoro.taskName).not.toContain('用户2');
      });
    });

    test('6.4 用户2只能看到自己的番茄钟记录', async () => {
      const response = await request(app)
        .get('/api/pomodoro')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      console.log(`✅ 用户2查看番茄钟记录数量: ${response.body.data.length}`);
      expect(response.body.success).toBe(true);
      
      // 检查所有记录都属于用户2
      response.body.data.forEach(pomodoro => {
        expect(pomodoro.taskName).not.toContain('用户1');
      });
    });
  });

  describe('7. 综合功能测试', () => {
    test('7.1 用户信息更新', async () => {
      console.log('\n👤 测试用户信息更新...');
      
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          nickname: '更新后的用户1',
          avatar: 'https://example.com/avatar1.jpg'
        })
        .expect(200);

      console.log(`✅ 用户信息更新成功: ${response.body.data.user.nickname}`);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.nickname).toBe('更新后的用户1');
    });

    test('7.2 任务状态切换', async () => {
      console.log('\n✅ 测试任务状态切换...');
      
      // 先获取用户1的第一个任务
      const tasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      if (tasksResponse.body.data.length > 0) {
        const taskId = tasksResponse.body.data[0]._id;
        
        const response = await request(app)
          .patch(`/api/tasks/${taskId}/toggle`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        console.log(`✅ 任务状态切换成功: ${response.body.message}`);
        expect(response.body.success).toBe(true);
      }
    });
  });
});