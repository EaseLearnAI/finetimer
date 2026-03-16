'use strict';

const gaodeMcpClient = require('../services/gaodeMcpClient');

/**
 * 高德地图控制器
 */

class GaodeController {
  /**
   * 查询天气
   * @param {import('express').Request} req - Express请求对象
   * @param {import('express').Response} res - Express响应对象
   */
  async queryWeather(req, res) {
    try {
      const { city } = req.query;
      
      if (!city) {
        return res.status(400).json({
          success: false,
          message: '城市参数不能为空'
        });
      }
      
      // 调用MCP客户端查询天气
      const weatherData = await gaodeMcpClient.queryWeather(city);
      
      res.json({
        success: true,
        message: '天气查询成功',
        data: weatherData
      });
    } catch (error) {
      console.error('[天气查询] 失败:', error);
      
      res.status(500).json({
        success: false,
        message: '天气查询失败，请稍后重试'
      });
    }
  }
  
  /**
   * 查询路线规划
   * @param {import('express').Request} req - Express请求对象
   * @param {import('express').Response} res - Express响应对象
   */
  async queryRoute(req, res) {
    try {
      const { origin, destination, mode = 'driving' } = req.query;
      
      // 参数验证
      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          message: '起点和终点参数不能为空'
        });
      }
      
      // 支持的出行方式
      const validModes = ['driving', 'bus', 'walking', 'bicycle'];
      if (!validModes.includes(mode)) {
        return res.status(400).json({
          success: false,
          message: '不支持的出行方式'
        });
      }
      
      // 调用MCP客户端查询路线
      const routeData = await gaodeMcpClient.queryRoute({
        origin,
        destination,
        mode
      });
      
      res.json({
        success: true,
        message: '路线规划成功',
        data: routeData
      });
    } catch (error) {
      console.error('[路线规划] 失败:', error);
      
      res.status(500).json({
        success: false,
        message: '路线规划失败，请稍后重试'
      });
    }
  }
}

module.exports = new GaodeController();