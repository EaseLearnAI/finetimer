'use strict';

const axios = require('axios');

// 配置基础URL
const BASE_URL = 'http://localhost:3000/api';
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

// 测试数据
let createdCollectionId = null;
let createdSubtaskId = null;

// 控制台输出样式
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  step: (msg) => console.log(`\n🔄 ${msg}`),
  data: (msg, data) => console.log(`📊 ${msg}:`, JSON.stringify(data, null, 2))
};

// 测试任务集API
async function testCollectionAPI() {
  log.step('开始测试任务集 API');
  
  try {
    // 1. 测试创建任务集
    log.step('测试创建任务集');
    const createResponse = await api.post('/collections', {
      name: '测试任务集',
      description: '这是一个用于API测试的任务集',
      userId: 'test-user-001'
    });
    
    if (createResponse.data.success) {
      createdCollectionId = createResponse.data.data._id;
      log.success('任务集创建成功');
      log.data('创建结果', createResponse.data.data);
    } else {
      log.error('任务集创建失败: ' + createResponse.data.message);
      return;
    }
    
    // 2. 测试获取任务集列表
    log.step('测试获取任务集列表');
    const listResponse = await api.get('/collections?userId=test-user-001');
    
    if (listResponse.data.success) {
      log.success(`获取到 ${listResponse.data.data.length} 个任务集`);
      log.data('任务集列表', listResponse.data.data);
    } else {
      log.error('获取任务集列表失败: ' + listResponse.data.message);
    }
    
    // 3. 测试获取单个任务集
    log.step('测试获取单个任务集');
    const getResponse = await api.get(`/collections/${createdCollectionId}`);
    
    if (getResponse.data.success) {
      log.success('获取任务集详情成功');
      log.data('任务集详情', getResponse.data.data);
    } else {
      log.error('获取任务集详情失败: ' + getResponse.data.message);
    }
    
    // 4. 测试更新任务集
    log.step('测试更新任务集');
    const updateResponse = await api.put(`/collections/${createdCollectionId}`, {
      name: '更新后的测试任务集',
      description: '这是更新后的描述'
    });
    
    if (updateResponse.data.success) {
      log.success('任务集更新成功');
      log.data('更新结果', updateResponse.data.data);
    } else {
      log.error('任务集更新失败: ' + updateResponse.data.message);
    }
    
    return true;
  } catch (error) {
    log.error('任务集API测试失败: ' + error.message);
    if (error.response) {
      log.data('错误响应', error.response.data);
    }
    return false;
  }
}

// 测试子任务API
async function testSubtaskAPI() {
  if (!createdCollectionId) {
    log.error('没有可用的任务集ID，跳过子任务测试');
    return false;
  }
  
  log.step('开始测试子任务 API');
  
  try {
    // 1. 测试创建子任务
    log.step('测试创建子任务');
    const createResponse = await api.post('/tasks', {
      title: '测试子任务',
      description: '这是一个测试子任务',
      priority: 'high',
      estimatedTime: 30,
      collectionId: createdCollectionId,
      userId: 'test-user-001'
    });
    
    if (createResponse.data.success) {
      createdSubtaskId = createResponse.data.data._id;
      log.success('子任务创建成功');
      log.data('创建结果', createResponse.data.data);
    } else {
      log.error('子任务创建失败: ' + createResponse.data.message);
      return false;
    }
    
    // 2. 测试获取任务集的子任务
    log.step('测试获取任务集的子任务');
    const tasksResponse = await api.get(`/tasks?collectionId=${createdCollectionId}`);
    
    if (tasksResponse.data.success) {
      log.success(`获取到 ${tasksResponse.data.data.length} 个子任务`);
      log.data('子任务列表', tasksResponse.data.data);
    } else {
      log.error('获取子任务列表失败: ' + tasksResponse.data.message);
    }
    
    // 3. 测试更新子任务
    log.step('测试更新子任务');
    const updateResponse = await api.put(`/tasks/${createdSubtaskId}`, {
      completed: true
    });
    
    if (updateResponse.data.success) {
      log.success('子任务更新成功');
      log.data('更新结果', updateResponse.data.data);
    } else {
      log.error('子任务更新失败: ' + updateResponse.data.message);
    }
    
    // 4. 再次获取任务集以查看进度更新
    log.step('测试进度计算 - 获取更新后的任务集');
    const collectionResponse = await api.get(`/collections/${createdCollectionId}`);
    
    if (collectionResponse.data.success) {
      log.success('任务集进度更新成功');
      log.data('更新后的任务集', collectionResponse.data.data);
    } else {
      log.error('获取更新后任务集失败: ' + collectionResponse.data.message);
    }
    
    return true;
  } catch (error) {
    log.error('子任务API测试失败: ' + error.message);
    if (error.response) {
      log.data('错误响应', error.response.data);
    }
    return false;
  }
}

// 测试统计信息API
async function testStatsAPI() {
  log.step('开始测试统计信息 API');
  
  try {
    const statsResponse = await api.get('/collections/stats?userId=test-user-001');
    
    if (statsResponse.data.success) {
      log.success('统计信息获取成功');
      log.data('统计信息', statsResponse.data.data);
    } else {
      log.error('统计信息获取失败: ' + statsResponse.data.message);
    }
    
    return true;
  } catch (error) {
    log.error('统计信息API测试失败: ' + error.message);
    if (error.response) {
      log.data('错误响应', error.response.data);
    }
    return false;
  }
}

// 清理测试数据
async function cleanup() {
  log.step('开始清理测试数据');
  
  try {
    // 删除创建的任务集（这将同时删除关联的子任务）
    if (createdCollectionId) {
      const deleteResponse = await api.delete(`/collections/${createdCollectionId}?force=true`);
      
      if (deleteResponse.data.success) {
        log.success('测试数据清理成功');
      } else {
        log.warn('测试数据清理失败: ' + deleteResponse.data.message);
      }
    }
  } catch (error) {
    log.warn('清理测试数据时出错: ' + error.message);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始 AIsiri 任务集 API 测试\n');
  
  let allTestsPassed = true;
  
  // 运行所有测试
  const collectionTestResult = await testCollectionAPI();
  allTestsPassed = allTestsPassed && collectionTestResult;
  
  const subtaskTestResult = await testSubtaskAPI();
  allTestsPassed = allTestsPassed && subtaskTestResult;
  
  const statsTestResult = await testStatsAPI();
  allTestsPassed = allTestsPassed && statsTestResult;
  
  // 清理测试数据
  await cleanup();
  
  // 显示测试结果
  console.log('\n📝 测试结果总结:');
  log.info(`任务集 API 测试: ${collectionTestResult ? '✅ 通过' : '❌ 失败'}`);
  log.info(`子任务 API 测试: ${subtaskTestResult ? '✅ 通过' : '❌ 失败'}`);
  log.info(`统计信息 API 测试: ${statsTestResult ? '✅ 通过' : '❌ 失败'}`);
  
  if (allTestsPassed) {
    console.log('\n🎉 所有测试都通过了！API 功能正常');
  } else {
    console.log('\n💥 部分测试失败，请检查API实现');
    process.exit(1);
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:3000/');
    log.success('服务器连接成功');
    return true;
  } catch (error) {
    log.error('无法连接到服务器，请确保服务器正在运行');
    log.info('请运行: npm start');
    return false;
  }
}

// 程序入口点
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  main().catch(error => {
    log.error('测试运行失败: ' + error.message);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testCollectionAPI,
  testSubtaskAPI,
  testStatsAPI
};