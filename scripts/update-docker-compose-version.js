const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 讀取 package.json 獲取版本號
const packageJson = require('../package.json');
const version = packageJson.version;

// 讀取 docker-compose.yml
const composePath = path.join(__dirname, '../docker-compose.yml');
const composeContent = fs.readFileSync(composePath, 'utf8');

// 解析 YAML
const compose = yaml.load(composeContent);

// 更新版本號
if (compose.services && compose.services['ai-mermaid']) {
  compose.services['ai-mermaid'].image = `ai-mermaid:${version}`;
  
  // 寫回檔案
  const updatedContent = yaml.dump(compose, { lineWidth: -1 });
  fs.writeFileSync(composePath, updatedContent, 'utf8');
  
  console.log(`✅ 已更新 docker-compose.yml 中的版本號為: ${version}`);
} else {
  console.error('❌ 無法更新 docker-compose.yml：找不到 services.ai-mermaid 配置');
  process.exit(1);
}
