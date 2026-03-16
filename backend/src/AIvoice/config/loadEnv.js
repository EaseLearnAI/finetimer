const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

(function loadEnv() {
  if (process.env.__ENV_LOADED === 'true') return;

  let loaded = false;

  // 1) 明确指定路径优先
  if (process.env.DOTENV_CONFIG_PATH && fs.existsSync(process.env.DOTENV_CONFIG_PATH)) {
    dotenv.config({ path: process.env.DOTENV_CONFIG_PATH });
    loaded = true;
  }

  // 2) 项目根目录 .env 文件
  if (!loaded) {
    const rootEnv = path.join(process.cwd(), '.env');
    if (fs.existsSync(rootEnv) && fs.statSync(rootEnv).isFile()) {
      dotenv.config({ path: rootEnv });
      loaded = true;
    }
  }

  // 3) 项目根目录 .env 目录下的 .env 文件
  if (!loaded) {
    const envDirFile = path.join(process.cwd(), '.env', '.env');
    if (fs.existsSync(envDirFile) && fs.statSync(envDirFile).isFile()) {
      dotenv.config({ path: envDirFile });
      loaded = true;
    }
  }

  // 4) 兜底：默认行为
  if (!loaded) {
    dotenv.config();
  }

  process.env.__ENV_LOADED = 'true';
})(); 