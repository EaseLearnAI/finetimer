'use strict';

const axios = require('axios');

// 配置
const API_BASE_URL = 'http://localhost:3000/api';
const FRONTEND_URL = 'http://localhost:8080';

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  step: (msg) => console.log(`\n🔄 ${msg}`),
};

// 测试后端API连接
async function testBackendConnection() {
  log.step('测试后端API连接');
  try {
    // 测试根路径
    const response = await axios.get('http://localhost:3000/');
    if (response.status === 200) {
      log.success('后端API连接正常');
      return true;
    }
  } catch (error) {
    log.error('后端API连接失败: ' + error.message);
    return false;
  }
}

// 测试前端服务连接
async function testFrontendConnection() {
  log.step('测试前端服务连接');
  try {
    const response = await axios.get(FRONTEND_URL);
    if (response.status === 200) {
      log.success('前端服务连接正常');
      return true;
    }
  } catch (error) {
    log.error('前端服务连接失败: ' + error.message);
    log.info('请确保运行了: npm run serve');
    return false;
  }
}

// 测试完整的API流程
async function testFullAPIFlow() {
  log.step('测试完整的API工作流程');
  
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000
  });

  try {
    // 1. 创建任务集
    log.info('1. 创建任务集...');
    const collectionResponse = await api.post('/collections', {
      name: '集成测试任务集',
      description: '用于前后端集成测试',
      userId: 'integration-test-user'
    });
    
    const collectionId = collectionResponse.data.data._id;
    log.success(`任务集创建成功，ID: ${collectionId}`);

    // 2. 创建子任务
    log.info('2. 创建子任务...');
    const taskResponse = await api.post('/tasks', {
      title: '集成测试子任务',
      description: '测试子任务',
      priority: 'medium',
      estimatedTime: 25,
      collectionId: collectionId,
      userId: 'integration-test-user'
    });
    
    const taskId = taskResponse.data.data._id;
    log.success(`子任务创建成功，ID: ${taskId}`);

    // 3. 获取任务集（包含子任务）
    log.info('3. 获取任务集详情...');
    const detailResponse = await api.get(`/collections/${collectionId}`);
    const collection = detailResponse.data.data;
    
    if (collection.subtasks && collection.subtasks.length > 0) {
      log.success(`任务集包含 ${collection.subtasks.length} 个子任务`);
    } else {
      log.error('任务集没有正确关联子任务');
      return false;
    }

    // 4. 更新子任务状态
    log.info('4. 切换子任务完成状态...');
    await api.put(`/tasks/${taskId}`, { completed: true });
    
    // 5. 验证进度更新
    log.info('5. 验证进度计算...');
    const updatedResponse = await api.get(`/collections/${collectionId}`);
    const updatedCollection = updatedResponse.data.data;
    
    if (updatedCollection.progressPercentage === 100) {
      log.success('进度计算正确：100%');
    } else {
      log.error(`进度计算错误，期望100%，实际${updatedCollection.progressPercentage}%`);
      return false;
    }

    // 6. 获取统计信息
    log.info('6. 获取统计信息...');
    const statsResponse = await api.get('/collections/stats?userId=integration-test-user');
    const stats = statsResponse.data.data;
    
    if (stats.collections.total >= 1 && stats.subtasks.total >= 1) {
      log.success(`统计信息正确：${stats.collections.total}个任务集，${stats.subtasks.total}个子任务`);
    } else {
      log.error('统计信息错误');
      return false;
    }

    // 7. 清理测试数据
    log.info('7. 清理测试数据...');
    await api.delete(`/collections/${collectionId}?force=true`);
    log.success('测试数据清理完成');

    return true;
  } catch (error) {
    log.error('API流程测试失败: ' + error.message);
    return false;
  }
}

// 输出前端访问信息
function outputAccessInfo() {
  log.step('🎯 前端访问信息');
  log.info('前端应用地址: http://localhost:8080');
  log.info('任务集页面: http://localhost:8080/task-collections');
  log.info('后端API地址: http://localhost:3000/api');
  
  log.step('📱 功能测试建议');
  log.info('1. 访问任务集页面，点击右上角+按钮创建任务集');
  log.info('2. 在任务集卡片中点击+按钮添加子任务');
  log.info('3. 点击子任务的圆圈切换完成状态');
  log.info('4. 观察进度条的实时更新');
  log.info('5. 测试展开/折叠功能');
}

// 主函数
async function runIntegrationTest() {
  console.log('🚀 AIsiri 任务集功能集成测试\n');
  
  const backendOk = await testBackendConnection();
  const frontendOk = await testFrontendConnection();
  
  if (backendOk && frontendOk) {
    log.step('✅ 前后端服务都正常运行');
    
    const apiTestOk = await testFullAPIFlow();
    
    if (apiTestOk) {
      log.step('🎉 集成测试全部通过！');
      log.success('前后端集成工作正常，可以开始使用任务集功能');
      outputAccessInfo();
    } else {
      log.step('💥 API集成测试失败');
    }
  } else {
    log.step('❌ 服务连接测试失败');
    if (!backendOk) {
      log.info('请启动后端服务: cd backendtimer && npm start');
    }
    if (!frontendOk) {
      log.info('请启动前端服务: cd timers && npm run serve');
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runIntegrationTest().catch(error => {
    log.error('集成测试失败: ' + error.message);
    process.exit(1);
  });
}

module.exports = { runIntegrationTest };