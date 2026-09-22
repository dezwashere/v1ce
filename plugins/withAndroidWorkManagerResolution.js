const { withProjectBuildGradle } = require("@expo/config-plugins");

module.exports = function withAndroidWorkManagerResolution(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== "groovy") return modConfig;

    const marker = "// V1CE AndroidX WorkManager resolution";
    if (!modConfig.modResults.contents.includes(marker)) {
      modConfig.modResults.contents += `
\n${marker}
allprojects {
  configurations.all {
    resolutionStrategy {
      force "androidx.work:work-runtime:2.8.1"
      force "androidx.work:work-runtime-ktx:2.8.1"
    }
  }
}
`;
    }
    return modConfig;
  });
};
