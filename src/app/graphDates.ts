import { LogDateData } from "./LogDateData";

const minDateReducer = (min: number, { first_at }: LogDateData) => Math.min(first_at, min);
const maxDateReducer = (max: number, { last_at }: LogDateData) => Math.max(last_at, max);
const minCountReducer = (min: number, { count }: LogDateData) => Math.min(count, min);
const maxCountReducer = (max: number, { count }: LogDateData) => Math.max(count, max);

export const graphDates = (data: LogDateData[]) => {
  if (data.length < 3) return "";

  const first = data[0];

  const minTime = data.reduce(minDateReducer, first.first_at);
  const maxTime = data.reduce(maxDateReducer, first.last_at);
  const timeRange = maxTime - minTime;

  let maxCount = data.reduce(maxCountReducer, first.count);
  let minCount = data.reduce(minCountReducer, first.count);
  let countRange = maxCount - minCount;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) return "";
  const width = 400;
  const gap = 10;
  const height = gap * 2;
  canvas.width = width;
  canvas.height = height;

  const getX = (date: number) => gap + (((date - minTime) / timeRange) * (width - gap * 2));
  const getLineWidth = (count: number) => {
    const minSize = gap / 6;
    const maxSize = gap / 2;
    const avgSize = (minSize + maxSize) / 2;
    const sizeRange = maxSize - minSize;
    if (countRange === 0) return avgSize;
    const scale = (count - minCount) / countRange;
    return (minSize + (sizeRange * scale));
  };
  ctx.strokeStyle = "lightblue";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(getX(minTime), gap);
  ctx.lineTo(getX(maxTime), gap);
  ctx.stroke();

  ctx.strokeStyle = "red";
  ctx.fillStyle = "red";
  data.forEach(({
    first_at,
    last_at,
    count
  }) => {
    const x1 = getX(first_at);
    const x2 = getX(last_at);
    ctx.lineWidth = getLineWidth(count);

    if (x1 === x2) {
      ctx.beginPath();
      ctx.arc(x1, gap, ctx.lineWidth, 0, Math.PI * 2, true);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x1, gap);
      ctx.lineTo(x2, gap);
      ctx.stroke();
    }
  });

  return canvas.toDataURL();
}