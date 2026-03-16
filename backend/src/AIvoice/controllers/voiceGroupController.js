const Agent = require('../models/Agent');

/**
 * 按组删除用户的一组合成语音
 * 请求体：
 * - user_id: string 必填
 * - group_index: number 可选（优先使用），0 基索引，对应 voiceGroups 数组位置
 * - encourage_url / criticize_url: 可选（当未提供 group_index 时，用URL匹配删除）
 */
async function deleteVoiceGroup(req, res) {
  try {
    const { user_id, group_index, encourage_url, criticize_url } = req.body || {};

    if (!user_id) {
      return res.status(400).json({ success: false, error: '缺少 user_id' });
    }

    const agent = await Agent.findOne({ user_id });
    if (!agent) {
      return res.status(404).json({ success: false, error: '未找到该用户的语音数据' });
    }

    const groups = Array.isArray(agent.voiceGroups) ? [...agent.voiceGroups] : [];
    if (groups.length === 0) {
      return res.status(400).json({ success: false, error: '当前没有可删除的语音分组' });
    }

    let indexToDelete = null;

    if (typeof group_index === 'number' && Number.isInteger(group_index)) {
      if (group_index < 0 || group_index >= groups.length) {
        return res.status(400).json({ success: false, error: 'group_index 越界' });
      }
      indexToDelete = group_index;
    } else if (encourage_url || criticize_url) {
      indexToDelete = groups.findIndex(g => {
        const matchEnc = encourage_url ? g.encourage_url === encourage_url : true;
        const matchCri = criticize_url ? g.criticize_url === criticize_url : true;
        return matchEnc && matchCri;
      });
      if (indexToDelete === -1) {
        return res.status(404).json({ success: false, error: '未找到匹配的语音分组' });
      }
    } else {
      return res.status(400).json({ success: false, error: '缺少 group_index 或 (encourage_url/criticize_url) 之一' });
    }

    // 执行删除
    const removed = groups.splice(indexToDelete, 1)[0];

    // 同步最新一组到兼容字段或清空
    agent.voiceGroups = groups;
    if (groups.length > 0) {
      const last = groups[groups.length - 1];
      agent.encourage_url = last.encourage_url || null;
      agent.criticize_url = last.criticize_url || null;
    } else {
      agent.encourage_url = null;
      agent.criticize_url = null;
    }

    await agent.save();

    return res.json({
      success: true,
      removed,
      groups_size: agent.voiceGroups.length,
      voice_groups: agent.voiceGroups,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: '删除失败', detail: e.message || e });
  }
}

module.exports = { deleteVoiceGroup };