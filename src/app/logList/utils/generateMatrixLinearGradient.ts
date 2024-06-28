export function generateMatrixLinearGradient(
  hash?: string,
  totalCells: number = 4
) {
  if (hash === undefined || hash === '') return "";

  let gradient = 'linear-gradient(to right';

  const colorPercent = 1 / totalCells;
  const hexSize = 3; // 0 to 4095
  const hues = 360;
  const step = 360 / hues;
  let hex = hash.substring(0, hexSize);
  let i = hexSize;
  for (let colorIndex = 0; colorIndex < totalCells; colorIndex++) {
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
  }
  gradient += ")";
  return gradient;
};
