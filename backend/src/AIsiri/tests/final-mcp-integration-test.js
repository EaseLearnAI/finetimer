const IntelligentDispatchService = require('../services/intelligentDispatchService');

async function testFinalMcpIntegration() {
  console.log('=== 最终MCP集成测试 ===');
  
  const service = new IntelligentDispatchService();
  
  try {
    // 测试路线规划请求
    const result = await service.processUserInput(
      '我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久',
      'test-user-123',
      'test-session-123'
    );
    
    console.log('\n=== 测试结果 ===');
    console.log('AI回复:', result.response);
    console.log('\n外部工具调用成功:', result.externalToolResult?.success);
    console.log('外部工具消息:', result.externalToolResult?.message);
    
    // 检查回复中是否包含时间信息
    const hasTimeInfo = result.response.includes('分钟') || result.response.includes('小时');
    console.log('\n包含时间信息:', hasTimeInfo ? '✅ 是' : '❌ 否');
    
    if (hasTimeInfo) {
      console.log('\n🎉 测试成功！MCP集成已正常工作，能够返回具体的路线时间信息。');
    } else {
      console.log('\n❌ 测试失败：回复中未包含具体的时间信息。');
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 运行测试
testFinalMcpIntegration();