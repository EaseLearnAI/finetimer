// MCP客户端实现
const axios = require('axios');
const path = require('path');
console.log('Current working directory:', process.cwd());
const envPath = path.resolve(__dirname, '../../../.env');
console.log('Attempting to load .env from:', envPath);
require('dotenv').config({ path: envPath });
console.log('GAODE_MAP_API_KEY after dotenv:', process.env.GAODE_MAP_API_KEY);

// 地理编码函数：将地址转换为经纬度
async function geocodeAddress(address, apiKey) {
  try {
    const url = `https://restapi.amap.com/v3/geocode/geo?key=${apiKey}&address=${encodeURIComponent(address)}&output=json`;
    const response = await axios.get(url);
    
    if (response.data.status === '1' && response.data.geocodes && response.data.geocodes.length > 0) {
      return response.data.geocodes[0].location;
    } else {
      throw new Error('无法获取地址的经纬度信息');
    }
  } catch (error) {
    throw new Error(`地理编码失败: ${error.message}`);
  }
}

async function run_mcp(params) {
  try {
    console.log('[MCP] 调用MCP服务:', params);
    
    // 检查是否是高德地图服务调用
    if (params.server_name === 'gaode-map') {
      const gaodeApiKey = process.env.GAODE_MAP_API_KEY;
      
      if (!gaodeApiKey || gaodeApiKey.length !== 32) {
        throw new Error('高德地图API Key未配置或格式不正确');
      }
      
      let url;
      
      // 根据工具名称调用不同的高德地图API
      if (params.tool_name === 'weather') {
        // 天气查询API
        url = `https://restapi.amap.com/v3/weather/weatherInfo?city=${encodeURIComponent(params.args.city)}&key=${gaodeApiKey}`;
      } else if (params.tool_name === 'route') {
        // 路线规划API（先获取地址的经纬度）
        const originLocation = await geocodeAddress(params.args.origin, gaodeApiKey);
        const destinationLocation = await geocodeAddress(params.args.destination, gaodeApiKey);
        // 构造路线规划API URL
        url = `https://restapi.amap.com/v5/direction/driving?origin=${originLocation}&destination=${destinationLocation}&key=${gaodeApiKey}`;
        
        // 如果有出行方式参数，添加到URL中
        if (params.args.mode) {
          url += `&mode=${params.args.mode}`;
        }
      } else {
        throw new Error(`不支持的高德地图工具: ${params.tool_name}`);
      }
      
      // 发送HTTP请求到高德地图API
      const response = await axios.get(url);
      
      // 返回API响应数据
      return {
        success: true,
        data: response.data
      };
    }
    
    // 对于其他MCP服务，返回模拟实现
    // 模拟MCP调用结果
    return {
      success: true,
      data: {
        message: 'MCP服务调用成功',
        params: params
      }
    };
  } catch (error) {
    console.error('[MCP] 调用MCP服务失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  run_mcp
};