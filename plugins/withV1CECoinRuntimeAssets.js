const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const VERSION = "1.0.0";

module.exports = function withV1CECoinRuntimeAssets(config) {
  return withDangerousMod(config, ["ios", async (modConfig) => {
    const projectRoot = modConfig.modRequest.projectRoot;
    const source = path.join(projectRoot, "modules", "v1ce-coin-renderer", "ios", "Assets", "V1CECoinMaster", VERSION);
    const destination = path.join(modConfig.modRequest.platformProjectRoot, "V1CECoinMaster", VERSION);
    fs.mkdirSync(destination, { recursive: true });
    for (const file of ["v1ce_coin_master.obj", "v1ce_coin_master.mtl", "v1ce_coin_master.glb", "v1ce-wordmark-approved.png", "manifest.json"]) {
      const from = path.join(source, file);
      if (!fs.existsSync(from)) throw new Error(`Missing V1CE coin runtime asset: ${from}`);
      fs.copyFileSync(from, path.join(destination, file));
    }
    return modConfig;
  }]);
};
