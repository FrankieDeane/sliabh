/**
 * Novedades que ve el usuario en el cartel "Última actualización".
 *
 * Cada vez que se publica una mejora, agregar una entrada NUEVA ARRIBA de todo
 * con un id distinto (la fecha alcanza). La app muestra el cartel una vez por
 * entrada: al abrirla después de actualizarse, sola, sin reinstalar.
 *
 * Escribirlo para alguien que camina, no para programadores: qué cambia para
 * él, en una línea cada cosa.
 */
export interface ChangelogEntry {
  /** Único. Si cambia, el cartel vuelve a aparecer. */
  id: string;
  /** AAAA-MM-DD */
  date: string;
  title: { es: string; en: string };
  /** onlyIfAutoUpdate: mostrarlo solo si esta instalación recibe actualizaciones automáticas. */
  items: Array<{ es: string; en: string; onlyIfAutoUpdate?: boolean }>;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-10-31',
    date: '2026-10-31',
    title: {
      es: 'Mapa sin señal más confiable',
      en: 'A more reliable offline map',
    },
    items: [
      {
        es: 'Los mapas que guardás con 💾 siguen ahí cuando cerrás y volvés a abrir la app.',
        en: 'Maps you save with 💾 are still there after you close and reopen the app.',
      },
      {
        es: 'Si acercás más de lo que descargaste, el mapa se ve algo borroso en vez de quedar en blanco.',
        en: 'Zooming in past what you downloaded shows a slightly blurry map instead of a blank one.',
      },
      {
        es: 'El mapa general, el de la caminata y el 3D de la ruta abren sin señal (si los abriste antes con señal).',
        en: 'The main map, the hike map and the 3D trail map open with no signal (once opened with signal).',
      },
      {
        es: 'La app ahora se actualiza sola. Cuando haya una mejora, te la contamos en este cartel.',
        en: 'The app now updates itself. When there is an improvement, this card tells you about it.',
        onlyIfAutoUpdate: true,
      },
    ],
  },
];

export const LATEST_CHANGE = CHANGELOG[0];
