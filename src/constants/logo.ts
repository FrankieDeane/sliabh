/** SVG logo as a data URI — stamp style matching the brand mark. */
export const LOGO_URI =
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E` +
  // Dark background circle
  `%3Ccircle cx='100' cy='100' r='96' fill='%23060d1b' stroke='%2322c55e' stroke-width='5'/%3E` +
  // Inner dashed ring
  `%3Ccircle cx='100' cy='100' r='87' fill='none' stroke='%2322c55e' stroke-width='1.8' stroke-dasharray='4 3'/%3E` +
  // Left peak
  `%3Cpolygon points='28,150 63,82 82,110' fill='%2322c55e'/%3E` +
  // Center peak (tallest)
  `%3Cpolygon points='63,150 100,50 137,150' fill='%2322c55e'/%3E` +
  // Right peak
  `%3Cpolygon points='118,110 137,82 172,150' fill='%2322c55e'/%3E` +
  // Snow cap
  `%3Cpolygon points='100,50 113,78 87,78' fill='%23f0fdf4'/%3E` +
  // Base band
  `%3Crect x='28' y='142' width='144' height='14' fill='%2322c55e'/%3E` +
  // Curved arc path for text
  `%3Cpath id='a' d='M30,100 A70,70 0 0 1 170,100' fill='none'/%3E` +
  // SLIABH text along arc
  `%3Ctext font-family='Georgia,serif' font-size='21' font-weight='bold' fill='%23f0fdf4' letter-spacing='7'%3E%3CtextPath href='%23a' startOffset='13%25'%3ESLIABH%3C/textPath%3E%3C/text%3E` +
  // Decorative dots
  `%3Ccircle cx='56' cy='68' r='3' fill='%2322c55e'/%3E` +
  `%3Ccircle cx='100' cy='43' r='3' fill='%2322c55e'/%3E` +
  `%3Ccircle cx='144' cy='68' r='3' fill='%2322c55e'/%3E` +
  `%3C/svg%3E`;
