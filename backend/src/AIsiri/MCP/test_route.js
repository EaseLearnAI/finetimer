require('dotenv').config({ path: '../../../backend/.env' });
const { run_mcp } = require('./mcp');

async function testRoute() {
  console.log('开始测试路线规划功能...');
  
  // 测试路线规划功能
  const routeResult = await run_mcp({
    server_name: 'gaode-map',
    tool_name: 'route',
    args: { 
      origin: '上海漕河泾B栋', 
      destination: '虹桥机场', 
      strategy: 0 
    }
  });
  
  console.log('路线规划结果:', JSON.stringify(routeResult, null, 2));
  
  // 提取预计行驶时间
  if (routeResult.success && routeResult.data.route) {
    const routeData = routeResult.data.route;
    
    // 从routeData.taxi_cost字段提取时间信息
    let durationValue = null;
    if (routeData.taxi_cost) {
      durationValue = parseInt(routeData.taxi_cost);
    }
    
    if (durationValue && !isNaN(durationValue)) {
      console.log(`从上海漕河泾B栋到虹桥机场预计需要 ${Math.floor(durationValue/60)} 分钟`);
    } else {
      console.log('无法获取预计时间');
    }
  }
  
  console.log('测试完成!');
}

testRoute();