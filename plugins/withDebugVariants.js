const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo config plugin to ensure debuggableVariants = [] is present (uncommented) in Android build.gradle.
 */
const withDebugVariants = (config) => {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            let buildGradle = config.modResults.contents;
            const androidBlockRegex = /android\s*\{[^}]*\}/s;
            if (androidBlockRegex.test(buildGradle)) {
                // Remove any commented debuggableVariants line
                buildGradle = buildGradle.replace(/\/\/\s*debuggableVariants\s*=\s*\[.*?\]/s, 'debuggableVariants = []');
                // Ensure an active line exists
                if (!buildGradle.includes('debuggableVariants = []')) {
                    buildGradle = buildGradle.replace(
                        /android\s*\{/,
                        `android {\n    // Ensure all variants bundle JS and assets\n    debuggableVariants = []`
                    );
                }
            }
            config.modResults.contents = buildGradle;
        }
        return config;
    });
};

module.exports = withDebugVariants;
