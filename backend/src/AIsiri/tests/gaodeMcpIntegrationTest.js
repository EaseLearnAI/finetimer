'use strict';

const gaodeMcpClient = require('../services/gaodeMcpClient');
require('dotenv').config({ path: '../../../.env' });

// 调试信息
console.log('GAODE_MAP_API_KEY:', process.env.GAODE_MAP_API_KEY);

async function runGaodeMcpTests() {
  console.log('开始测试高德地图MCP功能...');
  
  try {
    // 测试天气查询功能
    console.log('\n1. 测试天气查询功能:');
    const weatherResult = await gaodeMcpClient.queryWeather('上海');
    console.log('天气查询结果:', JSON.stringify(weatherResult, null, 2));
    
    // 测试路线规划功能
    console.log('\n2. 测试路线规划功能:');
    const routeResult = await gaodeMcpClient.queryRoute({
      origin: '上海漕河泾B栋',
      destination: '虹桥机场',
      strategy: 0  // 驾车路线规划
    });
    console.log('路线规划结果:', JSON.stringify(routeResult, null, 2));
    
    console.log('\n所有测试完成!');
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 执行测试
runGaodeMcpTests();