require('../config/loadEnv');

console.log('🔍 检查环境变量配置...\n');

// 检查OSS相关配置
console.log('📦 OSS配置:');
console.log(`  OSS_REGION: ${process.env.OSS_REGION || '未配置'}`);
console.log(`  OSS_ACCESS_KEY_ID: ${process.env.OSS_ACCESS_KEY_ID ? '已配置' : '未配置'}`);
console.log(`  OSS_ACCESS_KEY_SECRET: ${process.env.OSS_ACCESS_KEY_SECRET ? '已配置' : '未配置'}`);
console.log(`  OSS_BUCKET: ${process.env.OSS_BUCKET || '未配置'}`);

console.log('\n🔑 API密钥配置:');
console.log(`  DASHSCOPE_API_KEY: ${process.env.DASHSCOPE_API_KEY ? '已配置' : '未配置'}`);

console.log('\n📁 环境变量文件路径:');
console.log(`  当前工作目录: ${process.cwd()}`);
console.log(`  环境变量加载状态: ${process.env.__ENV_LOADED || '未加载'}`);

// 尝试加载.env文件
const fs = require('fs');
const path = require('path');

const possibleEnvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env', '.env'),
  path.join(__dirname, '../../../.env'),
  path.join(__dirname, '../../../.env', '.env')
];

console.log('\n🔍 查找.env文件:');
possibleEnvPaths.forEach((envPath, index) => {
  const exists = fs.existsSync(envPath);
  console.log(`  ${index + 1}. ${envPath}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
  if (exists) {
    try {
      const stats = fs.statSync(envPath);
      console.log(`     大小: ${stats.size} 字节`);
      console.log(`     修改时间: ${stats.mtime}`);
    } catch (error) {
      console.log(`     读取失败: ${error.message}`);
    }
  }
});

console.log('\n💡 建议:');
if (!process.env.DASHSCOPE_API_KEY) {
  console.log('  - 请配置 DASHSCOPE_API_KEY 环境变量');
}
if (!process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET) {
  console.log('  - 请配置 OSS_ACCESS_KEY_ID 和 OSS_ACCESS_KEY_SECRET 环境变量');
}
if (!process.env.OSS_BUCKET) {
  console.log('  - 建议配置 OSS_BUCKET 环境变量，当前使用默认值: vitebucket');
}

console.log('\n✅ 环境变量检查完成！');
