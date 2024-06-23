const hashImages: Record<string, string> = {};

export function generateMatrixImage(
  hash?: string,
  horizontalCells: number = 4,
  verticalCells: number = 4,
  border: boolean = true
) {
  if (hash === undefined) return "";

  if (hash in hashImages) {
    return hashImages[hash];
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) return '';
  // No less than 16x16 image
  // ensure each cell is at least 4 pixels wide/high
  canvas.width = Math.max(16, horizontalCells * 4);
  canvas.height = Math.max(16, verticalCells * 4);

  const cellWidth = canvas.width / horizontalCells;
  const cellHeight = canvas.height / verticalCells;

  const hexSize = 3; // 0 to 4095
  const hues = 360;
  const step = 360 / hues;
  let hex = hash.substring(0, hexSize);
  let i = hexSize;
  for (let y = 0; y < verticalCells; y++) {
    for (let x = 0; x < horizontalCells; x++) {
      const value = parseInt(hex, 16);
      const hue = Math.floor((value % hues) * step);
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
      i += hexSize;
      hex = hash.substring(i, i + hexSize);
      if (hex.length < hexSize) {
        i = hexSize - hex.length;
        hex += hash.substring(0, i);
      }
    }
  }
  if (border) {
    ctx.lineWidth = .25;
    ctx.strokeStyle = 'black';
    for (let y = 0; y <= verticalCells; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellHeight);
      ctx.lineTo(canvas.width, y * cellHeight);
      ctx.stroke();
    }
    for (let x = 0; x <= horizontalCells; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellWidth, 0);
      ctx.lineTo(x * cellWidth, canvas.height);
      ctx.stroke();
    }
  }
  const url = canvas.toDataURL();
  hashImages[hash] = url;
  return url;
};
