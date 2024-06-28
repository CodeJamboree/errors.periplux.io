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

  const totalCells = horizontalCells * verticalCells;
  const colorPercent = 1 / totalCells;

  const hexSize = 3; // 0 to 4095
  const hues = 360;
  const step = 360 / hues;
  let hex = hash.substring(0, hexSize);
  let i = hexSize;
  let colorIndex = 0;
  for (let y = 0; y < verticalCells; y++) {
    for (let x = 0; x < horizontalCells; x++) {
      const value = parseInt(hex, 16);
      const hue = Math.floor((value % hues) * step);
      const start = Math.floor(colorIndex * colorPercent * 100);
      const end = Math.floor((colorIndex + 1) * colorPercent * 100);
      const color = `hsl(${hue}, 100%, 50%)`;
      gradient += `, ${color} ${start}%`;
      gradient += `, ${color} ${end}%`;
      i += hexSize;
      hex = hash.substring(i, i + hexSize);
      if (hex.length < hexSize) {
        i = hexSize - hex.length;
        hex += hash.substring(0, i);
      }
      colorIndex++;
    }
  }
  gradient += ")";
  hashImages[hash] = gradient;
  return gradient;
};
