const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withFullScreenSplash(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const storyboardPath = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName,
        "SplashScreen.storyboard"
      );

      let storyboard = fs.readFileSync(storyboardPath, "utf8");

      // Replace fixed center constraints with edge-to-edge constraints
      storyboard = storyboard.replace(
        /<constraint[^>]+firstAttribute="centerX"[^>]*\/>/g,
        '<constraint firstItem="EXPO-SplashScreen" firstAttribute="leading" secondItem="EXPO-ContainerView" secondAttribute="leading" id="splash-leading"/>'
      );
      storyboard = storyboard.replace(
        /<constraint[^>]+firstAttribute="centerY"[^>]*\/>/g,
        '<constraint firstItem="EXPO-SplashScreen" firstAttribute="top" secondItem="EXPO-ContainerView" secondAttribute="top" id="splash-top"/>\n                            <constraint firstItem="EXPO-SplashScreen" firstAttribute="bottom" secondItem="EXPO-ContainerView" secondAttribute="bottom" id="splash-bottom"/>\n                            <constraint firstItem="EXPO-SplashScreen" firstAttribute="trailing" secondItem="EXPO-ContainerView" secondAttribute="trailing" id="splash-trailing"/>'
      );

      // Fix image frame to full screen
      storyboard = storyboard.replace(
        /(<imageView[^>]*EXPO-SplashScreen[^>]*>[\s\S]*?<rect key="frame")[^\/]*\/>/,
        '$1 x="0.0" y="0.0" width="393" height="852"/>'
      );

      fs.writeFileSync(storyboardPath, storyboard);
      return config;
    },
  ]);
};
