/**
 * Actualizaciones automáticas (sin reinstalar la app).
 *
 * app.json sigue siendo la fuente de verdad; esto solo agrega a dónde va a
 * buscar actualizaciones la app instalada. El id del proyecto de Expo viene de
 * la variable EAS_PROJECT_ID (en GitHub: Settings → Secrets and variables →
 * Actions → Variables). Sin ella la app funciona igual que siempre, con el
 * código que trae el APK, y simplemente no busca actualizaciones.
 *
 * Qué se puede actualizar así: todo lo que es JavaScript (pantallas, mapas,
 * textos, arreglos de lógica). Qué no: permisos, librerías nativas, ícono,
 * versión de Expo. Eso cambia la "huella" nativa (ver fingerprint.config.js)
 * y la app instalada ignora esa actualización hasta que se instale un APK
 * nuevo — nunca carga código que no sea compatible con lo que tiene.
 */
module.exports = ({ config }) => {
  const projectId = process.env.EAS_PROJECT_ID;
  if (!projectId) return config;
  return {
    ...config,
    owner: process.env.EAS_OWNER || config.owner,
    extra: { ...config.extra, eas: { ...(config.extra?.eas ?? {}), projectId } },
    updates: {
      url: `https://u.expo.dev/${projectId}`,
      enabled: true,
      // Al abrir, busca en segundo plano; la mejora queda lista para la
      // próxima vez que se abra (o al tocar "Reiniciar" en el aviso). Nunca
      // demora la apertura: en la montaña, sin señal, abre al instante.
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
      // Los APK se compilan en GitHub, no en EAS Build, así que el canal se
      // fija acá: el workflow "Actualización automática" publica en este.
      requestHeaders: { 'expo-channel-name': 'production' },
    },
  };
};
