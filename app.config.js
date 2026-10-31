/**
 * Actualizaciones automáticas (sin reinstalar la app).
 *
 * app.json sigue siendo la fuente de verdad; esto solo le dice a la app
 * instalada dónde buscar código nuevo: en el propio sitio, sliabh.com.ar.
 * Netlify arma la actualización en cada publicación
 * (scripts/build-app-updates.mjs) y netlify/edge-functions/app-updates.ts se
 * la entrega a cada teléfono. Sin cuentas ni servicios de terceros.
 *
 * Qué se puede actualizar así: todo lo que es JavaScript (pantallas, mapas,
 * textos, arreglos de lógica). Qué no: permisos, librerías nativas, ícono,
 * versión de Expo. Eso cambia la "huella" nativa (fingerprint.config.js) y la
 * app instalada no recibe esa actualización hasta tener un APK nuevo: nunca
 * carga código que no sea compatible con lo que tiene.
 */
const UPDATES_URL = 'https://sliabh.com.ar/api/app-updates';

module.exports = ({ config }) => ({
  ...config,
  updates: {
    url: UPDATES_URL,
    enabled: true,
    // Al abrir, busca en segundo plano; la mejora queda lista para la próxima
    // vez que se abra (o al tocar "Actualizar ahora" en el aviso). Nunca demora
    // la apertura: en la montaña, sin señal, abre al instante.
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
});
