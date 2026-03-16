const { generateEncourageAndCriticize } = require('../services/aiService');

async function imitateText(req, res) {
  try {
    const { name, encourage_tone, criticize_tone } = req.body;
    if (!name || !encourage_tone || !criticize_tone) {
      return res.status(400).json({ error: '缺少 name、encourage_tone 或 criticize_tone' });
    }
    const result = await generateEncourageAndCriticize(name, encourage_tone, criticize_tone);
    return res.json({ success: true, ...result });
  } catch (e) {
    return res.status(500).json({ error: 'AI生成失败', detail: e.message || e });
  }
}

module.exports = { imitateText }; 