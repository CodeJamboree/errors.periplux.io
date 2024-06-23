import { Pipe, PipeTransform } from '@angular/core';
import { Duration, DurationObjectUnits } from 'luxon';

type unitType = keyof DurationObjectUnits;
const unitTypes: unitType[] = [
  'years',
  'quarters',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds'
];

@Pipe({
  name: 'age',
  standalone: true
})
export class AgePipe implements PipeTransform {
  transform(ms: number) {
    const now = new Date().valueOf();
    if (ms === now) return "Now";
    const diff = Duration.fromMillis(now - ms).rescale().toObject();
    let first = -1;
    unitTypes.forEach((unit, i) => {
      if (diff[unit] && diff[unit] !== 0) {
        if (first === -1) {
          first = i;
        } else if (i > first + 2) {
          delete diff[unit];
        }
      }
    });

    return Duration.fromDurationLike(diff).toHuman();
  }
}