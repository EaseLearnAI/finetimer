require('../config/loadEnv');
const axios = require('axios');

const API_KEY = 'sk-2904b4f09f5f4a29b2cdcc748e27da9e';
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

async function generateEncourageAndCriticize(name, encourageTone, criticizeTone) {
  if (!API_KEY) {
    throw new Error('缺少阿里云通义千问API密钥');
  }

  const systemPrompt = `你是一个专业的人设语气模仿专家。请深度理解并模仿"${name}"这个角色的独特人格特征。

角色分析要求：
- 深入理解"${name}"的性格、说话习惯、用词偏好
- "${encourageTone}"风格应体现该角色鼓励时的独特方式和语言特色
- "${criticizeTone}"风格应体现该角色批评时的独特表达和语气特点

生成要求：
1. 用"${name}"的"${encourageTone}"语气，生成一句符合其人设的鼓励话语（15字以内）
2. 用"${name}"的"${criticizeTone}"语气，生成一句符合其人设的批评话语（15字以内）
3. 必须高度还原角色的语言风格、用词习惯和表达方式
4. 只输出如下JSON格式，不要输出多余内容：
{"encourage":"...", "criticize":"..."}`;

  const data = {
    model: 'qwen-turbo',
    input: {
      messages: [
        {
          role: 'user',
          content: systemPrompt
        }
      ]
    },
    parameters: {
      result_format: 'message'
    }
  };

  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post(BASE_URL, data, { headers });
    
    if (response.data && response.data.output && response.data.output.choices && response.data.output.choices[0]) {
      const content = response.data.output.choices[0].message.content;
      const rawContent = String(content).replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(rawContent);
      return result;
    }
    
    throw new Error(response.data && response.data.message ? response.data.message : 'AI接口返回异常');
  } catch (error) {
    if (error.response) {
      throw new Error(`API调用失败: ${error.response.data?.message || error.response.statusText}`);
    }
    throw error;
  }
}

module.exports = { generateEncourageAndCriticize };