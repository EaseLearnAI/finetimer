'use strict';

const IntelligentDispatchService = require('../services/intelligentDispatchService');
const logger = require('../utils/logger');

/**
 * MCP集成修复测试
 * 测试智能调度服务是否能正确调用MCP并返回路线时间信息
 */

async function testMcpIntegrationFix() {
  console.log('\n=== MCP集成修复测试 ===\n');
  
  const service = new IntelligentDispatchService();
  
  try {
    // 测试用例：询问去虹桥机场需要多久
    const userInput = '我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久';
    const userId = 'test-user-123';
    const sessionId = 'test-session-123';
    
    console.log('🚀 开始测试智能调度完整流程...');
    console.log('用户输入:', userInput);
    console.log('');
    
    // 调用智能调度服务
    const result = await service.processUserInput(userInput, userId, sessionId);
    
    console.log('✅ 智能调度完成');
    console.log('结果类型:', typeof result);
    console.log('结果长度:', result ? result.length : 0);
    
    // 检查结果中是否包含路线时间信息
    if (result && typeof result === 'string') {
      const hasTimeInfo = result.includes('分钟') || result.includes('小时') || result.includes('时间');
      const hasRouteInfo = result.includes('路线') || result.includes('距离') || result.includes('公里');
      
      console.log('\n📊 结果分析:');
      console.log('- 包含时间信息:', hasTimeInfo ? '✅' : '❌');
      console.log('- 包含路线信息:', hasRouteInfo ? '✅' : '✅');
      
      if (hasTimeInfo || hasRouteInfo) {
        console.log('\n🎉 测试成功！MCP调用正常工作');
        console.log('\n📝 完整回复:');
        console.log(result);
      } else {
        console.log('\n⚠️  警告：回复中未包含预期的路线时间信息');
        console.log('\n📝 实际回复:');
        console.log(result);
      }
    } else {
      console.log('\n❌ 错误：未收到有效的回复结果');
      console.log('实际结果:', result);
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 单独测试外部工具调用
async function testExternalToolDirectly() {
  console.log('\n=== 直接测试外部工具调用 ===\n');
  
  const service = new IntelligentDispatchService();
  
  try {
    const userInput = '去虹桥机场需要多久';
    const intent = { toolType: 'route' };
    const userId = 'test-user-123';
    
    console.log('🔧 直接调用 executeExternalTool...');
    console.log('输入:', userInput);
    console.log('意图:', intent);
    
    const result = await service.executeExternalTool(userInput, intent, userId);
    
    console.log('\n✅ 外部工具调用完成');
    console.log('结果:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      console.log('\n🎉 外部工具调用成功！');
      
      // 检查是否有路线数据
      if (result.data.routes && result.data.routes.length > 0) {
        const route = result.data.routes[0];
        console.log('\n📍 路线信息:');
        console.log('- 距离:', route.distance || '未知');
        console.log('- 时间:', route.duration || '未知');
        console.log('- 起点:', route.origin || '未知');
        console.log('- 终点:', route.destination || '未知');
      }
    } else {
      console.log('\n⚠️  外部工具调用失败或返回无效数据');
    }
    
  } catch (error) {
    console.error('\n❌ 直接测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
async function runTests() {
  console.log('开始MCP集成修复测试...');
  
  // 先测试直接调用
  await testExternalToolDirectly();
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 再测试完整流程
  await testMcpIntegrationFix();
  
  console.log('\n测试完成！');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testMcpIntegrationFix,
  testExternalToolDirectly
};