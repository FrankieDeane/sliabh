/**
 * Qué cuenta como "cambio nativo" para las actualizaciones automáticas.
 *
 * La app recibe código nuevo sin reinstalar (expo-updates), pero solo si el
 * código es compatible con lo nativo que ya tiene instalado. La "huella"
 * (fingerprint) de lo nativo decide eso: si cambia, hace falta un APK nuevo.
 *
 * El número de versión no es un cambio nativo: el workflow de Android le pone
 * a cada APK su propio versionCode, y eso no debe cortar las actualizaciones.
 */
const { SourceSkips } = require('@expo/fingerprint');

/** @type {import('@expo/fingerprint').Config} */
module.exports = {
  sourceSkips:
    SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun |
    SourceSkips.ExpoConfigVersions |
    SourceSkips.ExpoConfigRuntimeVersionIfString |
    SourceSkips.ExpoConfigEASProject,
};
