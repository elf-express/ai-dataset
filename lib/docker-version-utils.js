const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * 更新 docker-compose.yml 中的版本號
 * @param {string} version - 要設定的版本號
 * @param {string} [composePath=path.join(process.cwd(), 'docker-compose.yml')] - docker-compose.yml 的路徑
 * @returns {boolean} 更新是否成功
 */
function updateDockerComposeVersion(version, composePath = path.join(process.cwd(), 'docker-compose.yml')) {
  try {
    // 讀取 docker-compose.yml
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
      return true;
    } else {
      console.error('❌ 無法更新 docker-compose.yml：找不到 services.ai-mermaid 配置');
      return false;
    }
  } catch (error) {
    console.error('❌ 更新 docker-compose.yml 時發生錯誤:', error.message);
    return false;
  }
}

/**
 * 從 package.json 讀取版本號並更新 docker-compose.yml
 * @param {string} [packageJsonPath=path.join(process.cwd(), 'package.json')] - package.json 的路徑
 * @param {string} [composePath] - docker-compose.yml 的路徑
 * @returns {boolean} 更新是否成功
 */
function updateDockerComposeVersionFromPackage(packageJsonPath, composePath) {
  try {
    // 讀取 package.json 獲取版本號
    const packageJson = require(packageJsonPath || path.join(process.cwd(), 'package.json'));
    const version = packageJson.version;

    // 更新 docker-compose.yml 中的版本號
    return updateDockerComposeVersion(version, composePath);
  } catch (error) {
    console.error('❌ 讀取 package.json 時發生錯誤:', error.message);
    return false;
  }
}

// 如果直接執行此文件（而不是被 require）
if (require.main === module) {
  const success = updateDockerComposeVersionFromPackage();
  process.exit(success ? 0 : 1);
}

module.exports = {
  updateDockerComposeVersion,
  updateDockerComposeVersionFromPackage
};
