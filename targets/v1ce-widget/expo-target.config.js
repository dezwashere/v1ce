module.exports = (config) => ({
  type: "widget",
  name: "V1CEWidget",
  bundleIdentifier: ".widget",
  deploymentTarget: "16.0",
  frameworks: ["SwiftUI", "WidgetKit", "SceneKit", "Metal"],
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements?.["com.apple.security.application-groups"] || ["group.app.v1ce"],
  },
});
