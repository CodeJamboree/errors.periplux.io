const hashImages: Record<string, string> = {};

export function generateMatrixLinearGradient(
  hash?: string,
  horizontalCells: number = 2,
  verticalCells: number = 2,
  border: boolean = true
) {
  if (hash === undefined || hash === '') return "";

  if (hash in hashImages) {
    return hashImages[hash];
  }

  let gradient = 'linear-gradient(to right';

  const hexSize = 3; // 0 to 4095
  const hues = 360;
  const step = 360 / hues;
  let hex = hash.substring(0, hexSize);
  let i = hexSize;
  for (let y = 0; y < verticalCells; y++) {
    for (let x = 0; x < horizontalCells; x++) {
      const value = parseInt(hex, 16);
      const hue = Math.floor((value % hues) * step);
      gradient += `, hsl(${hue}, 100%, 50%)`;
      i += hexSize;
      hex = hash.substring(i, i + hexSize);
      if (hex.length < hexSize) {
        i = hexSize - hex.length;
        hex += hash.substring(0, i);
      }
    }
  }
  gradient += ")";
  hashImages[hash] = gradient;
  return gradient;
};
