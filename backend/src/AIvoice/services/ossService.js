const path = require('path');
require('../config/loadEnv');
const OSS = require('ali-oss');

const client = new OSS({
  region: process.env.OSS_REGION || 'oss-cn-hangzhou',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET || 'vitebucket',
});

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.m4a') return 'audio/mp4';
  // 添加图片类型支持
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.bmp') return 'image/bmp';
  return 'application/octet-stream';
}

async function uploadToOSS(localFilePath, ossFileName) {
  const contentType = getContentType(ossFileName);
  const result = await client.put(ossFileName, path.normalize(localFilePath), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
    }
  });
  return result.url;
}

module.exports = { uploadToOSS }; 