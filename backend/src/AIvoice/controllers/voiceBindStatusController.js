const Agent = require('../models/Agent');

async function getBindStatus(req, res) {
  try {
    const user_id = (req.params && req.params.user_id) || (req.query && req.query.user_id);
    if (!user_id) {
      return res.status(400).json({ error: '缺少 user_id' });
    }
    const agent = await Agent.findOne({ user_id });
    if (agent && agent.cosyvoice) {
      return res.json({
        binded: true,
        voice_id: agent.cosyvoice,
        encourage_url: agent.encourage_url || null,
        criticize_url: agent.criticize_url || null,
        voice_groups: agent.voiceGroups || [],
        groups_size: (agent.voiceGroups || []).length
      });
    }
    return res.json({ binded: false });
  } catch (e) {
    return res.status(500).json({ error: '查询失败', detail: e.message || e });
  }
}

module.exports = { getBindStatus }; 