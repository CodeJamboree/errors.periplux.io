import { Pipe, PipeTransform } from '@angular/core';
import { Duration } from 'luxon';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {
  transform(ms: number) {
    if (ms === 0) return "Instant";
    return Duration.fromMillis(ms).rescale().toHuman();
  }
}