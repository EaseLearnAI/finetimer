require('../config/loadEnv');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const Agent = require('../models/Agent');
const { uploadToOSS } = require('../services/ossService');

function synthesizeAndUpload(voice_id, text, filename) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(process.cwd(), 'tmp_audio', filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const env = { ...process.env };
    if (!env.DASHSCOPE_API_KEY) {
      reject('未配置环境变量 DASHSCOPE_API_KEY');
      return;
    }
    execFile('python', [
      path.join(__dirname, '../synthesize_voice.py'),
      voice_id,
      text,
      outputPath
    ], { env }, async (error, stdout, stderr) => {
      if (error) return reject(stderr || error.message);
      try {
        const ossUrl = await uploadToOSS(outputPath, `audio/${filename}`);
        try { fs.unlinkSync(outputPath); } catch (e) {}
        resolve(ossUrl);
      } catch (e) {
        reject(e.message || e);
      }
    });
  });
}

async function synthesizeVoice(req, res) {
  try {
    const { user_id, encourage_text, criticize_text } = req.body;
    if (!user_id || !encourage_text || !criticize_text) {
      return res.status(400).json({ error: '缺少 user_id、encourage_text 或 criticize_text' });
    }
    const agent = await Agent.findOne({ user_id });
    if (!agent || !agent.cosyvoice) {
      return res.status(400).json({ error: '未绑定音色，请先完成语音复刻' });
    }

    const voice_id = agent.cosyvoice;

    const encourageFilename = `encourage_${user_id}_${Date.now()}.mp3`;
    const criticizeFilename = `criticize_${user_id}_${Date.now()}.mp3`;

    const encourageUrl = await synthesizeAndUpload(voice_id, encourage_text, encourageFilename);
    const criticizeUrl = await synthesizeAndUpload(voice_id, criticize_text, criticizeFilename);

    // 兼容字段：最新一组
    agent.encourage_url = encourageUrl;
    agent.criticize_url = criticizeUrl;

    // 追加新组并限制最多5组（保留最新5组）
    const groups = agent.voiceGroups || [];
    groups.push({ encourage_url: encourageUrl, criticize_url: criticizeUrl, createdAt: new Date() });
    agent.voiceGroups = groups.slice(-5);

    await agent.save();

    return res.json({ success: true, encourage_url: encourageUrl, criticize_url: criticizeUrl, groups_size: agent.voiceGroups.length, voice_groups: agent.voiceGroups });
  } catch (e) {
    return res.status(500).json({ error: '语音合成或上传失败', detail: e.message || e });
  }
}

module.exports = { synthesizeVoice }; 