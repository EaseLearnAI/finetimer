'use strict';

const { run_mcp } = require('../MCP/mcp');

/**
 * 高德地图MCP客户端
 */

class GaodeMcpClient {
  /**
   * 查询天气
   * @param {string} city - 城市名称
   * @returns {Promise<Object>} 天气信息
   */
  async queryWeather(city) {
    try {
      console.log(`[高德MCP] 发起天气查询请求: ${city}`);
      
      // 调用高德地图MCP的天气查询功能
      const result = await run_mcp({
        server_name: 'gaode-map',
        tool_name: 'weather',
        args: { city }
      });
      
      console.log(`[高德MCP] 天气查询成功:`, result);
      return result;
    } catch (error) {
      console.error(`[高德MCP] 天气查询失败:`, error);
      throw error;
    }
  }

  /**
   * 查询路线规划
   * @param {Object} options - 路线规划选项
   * @param {string} options.origin - 起点坐标 (经度,纬度)
   * @param {string} options.destination - 终点坐标 (经度,纬度)
   * @param {string} options.mode - 出行方式 (driving/bus/walking/bicycle)
   * @returns {Promise<Object>} 路线规划信息
   */
  async queryRoute(options) {
    try {
      console.log(`[高德MCP] 发起路线规划请求:`, options);
      
      // 调用高德地图MCP的路径规划功能
      const result = await run_mcp({
        server_name: 'gaode-map',
        tool_name: 'route',
        args: options
      });
      
      console.log(`[高德MCP] 路线规划成功:`, result);
      return result;
    } catch (error) {
      console.error(`[高德MCP] 路线规划失败:`, error);
      throw error;
    }
  }
}

module.exports = new GaodeMcpClient();