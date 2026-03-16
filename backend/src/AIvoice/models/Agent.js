const mongoose = require('mongoose');

const VoiceGroupSchema = new mongoose.Schema(
	{
		encourage_url: { type: String, required: true },
		criticize_url: { type: String, required: true },
		createdAt: { type: Date, default: Date.now }
	},
	{ _id: false }
);

const AgentSchema = new mongoose.Schema(
	{
		user_id: { type: String, required: true, unique: true, index: true },
		cosyvoice: { type: String, default: null },
		encourage_url: { type: String, default: null },
		criticize_url: { type: String, default: null },
		voiceGroups: { type: [VoiceGroupSchema], default: [] }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Agent', AgentSchema); 