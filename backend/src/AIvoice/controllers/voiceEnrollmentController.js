const axios = require('axios');
const Agent = require('../models/Agent');
const { config } = require('dotenv');

config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function enrollOrUpdateVoice(req, res) {
  try {
    const { user_id, oss_url } = req.body;
    if (!user_id || !oss_url) {
      return res.status(400).json({ error: '缺少 user_id 或 oss_url' });
    }
    if (!API_KEY) {
      return res.status(500).json({ error: '未配置环境变量 DASHSCOPE_API_KEY' });
    }

    let agent = await Agent.findOne({ user_id });
    const isUpdate = !!(agent && agent.cosyvoice);

    const apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization';
    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    };

    let data;
    if (isUpdate) {
      data = {
        model: 'voice-enrollment',
        input: {
          action: 'update_voice',
          voice_id: agent.cosyvoice,
          url: oss_url,
        }
      };
    } else {
      data = {
        model: 'voice-enrollment',
        input: {
          action: 'create_voice',
          target_model: 'cosyvoice-v2',
          prefix: user_id.toLowerCase().slice(0, 10),
          url: oss_url,
        }
      };
    }

    const response = await axios.post(apiUrl, data, { headers });
    const respData = response.data || {};

    if (!isUpdate) {
      const resultVoiceId = respData.voice_id || (respData.output && respData.output.voice_id);
      if (resultVoiceId) {
        if (!agent) {
          agent = new Agent({ user_id, cosyvoice: resultVoiceId });
        } else {
          agent.cosyvoice = resultVoiceId;
        }
        await agent.save();
      } else {
        return res.status(502).json({ error: '通义千问未返回voice_id', detail: respData });
      }
    } else {
      await agent.save();
    }

    return res.json({ success: true, action: isUpdate ? 'update_voice' : 'create_voice', result: respData });
  } catch (e) {
    // MongoDB 索引重复错误
    if (e && (e.code === 11000 || (e.name === 'MongoServerError' && e.code === 11000))) {
      return res.status(409).json({ error: '数据库唯一索引冲突', detail: e.message, hint: '请运行 npm run fix:indexes 清理过期索引后重试' });
    }
    // 外部接口错误或其他错误
    const detail = e && e.response ? e.response.data : (e.message || e);
    return res.status(500).json({ error: '调用通义千问接口失败', detail });
  }
}

module.exports = { enrollOrUpdateVoice }; 