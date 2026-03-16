'use strict';

const gaodeMcpClient = require('../services/gaodeMcpClient');

/**
 * 高德地图MCP功能测试
 */

async function testGaodeMcp() {
  console.log('开始测试高德地图MCP功能...');
  
  try {
    // 测试天气查询功能
    console.log('\n=== 测试天气查询功能 ===');
    const weatherResult = await gaodeMcpClient.queryWeather('上海');
    console.log('✅ 天气查询成功:', JSON.stringify(weatherResult, null, 2));
    
    // 测试路线规划功能
    console.log('\n=== 测试路线规划功能 ===');
    const routeResult = await gaodeMcpClient.queryRoute({
      origin: '121.473701,31.230407', // 上海漕河泾B栋
      destination: '121.325183,31.194365', // 虹桥机场
      mode: 'driving'
    });
    console.log('✅ 路线规划成功:', JSON.stringify(routeResult, null, 2));
    
    console.log('\n🎉 所有测试通过，高德地图MCP功能正常工作！');
    return true;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testGaodeMcp().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testGaodeMcp;