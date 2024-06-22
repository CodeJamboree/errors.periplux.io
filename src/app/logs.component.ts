import { Component, OnInit } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { LogsService } from './logs.service';

interface LogData {
  id: number,
  scope: string,
  last_at: number,
  type: string,
  message: string,
  path: string,
  line: number,
  count: number
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  imports: [NgFor, CommonModule],
  standalone: true
})
export class LogsComponent implements OnInit {
  data: LogData[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  hashImages: Record<string, string> = {};

  constructor(private logsService: LogsService) {
  }

  ngOnInit() {
    this.loadData(this.currentPage);
  }

  loadData(pageNumber: number) {
    this.logsService.getPage(pageNumber, this.pageSize)
      .subscribe(response => {
        this.data = response.data;
        this.totalItems = response.total;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      });
  }
  generateMatrixImage(
    text: string,
    horizontalCells: number = 4,
    verticalCells: number = 4,
    border: boolean = true
  ) {
    const step = 4;
    const values = [];
    const totalCells = horizontalCells * verticalCells;
    for (let i = 0; i < totalCells; i++) {
      let marquee = text;
      if (marquee.length === 0) marquee = 'filler text';
      // Repeat text so that we have enough to rotate
      while (marquee.length < i) marquee += marquee;
      // Rotate text
      marquee = marquee.substring(i) + marquee.substring(0, i - 1);
      // Loop through each character, initializing the sum with i
      values[i] = [...marquee].reduce((sum, char) =>
        // Don't go over hue max of 360
        (sum + char.charCodeAt(0)) % (360 / step)
        , i);
    }
    let hash = `${horizontalCells}x${verticalCells}[${border}]:${values.join(",")}`;

    if (hash in this.hashImages) {
      return this.hashImages[hash];
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

    for (let y = 0; y < verticalCells; y++) {
      for (let x = 0; x < horizontalCells; x++) {
        const hue = values[(y * verticalCells) + x] * step;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
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
    this.hashImages[hash] = url;
    return url;
  }
  parseFile(path: string) {
    const i = path.lastIndexOf('/');
    if (i === -1) return '';
    return path.substring(i + 1);
  }
  errorTypeAsEmoji(type: string) {
    const lower = type.toLocaleLowerCase();
    const squaredSos = '\u{1f198}';
    const information = '\u2139\ufe0f';
    const crossMark = '\u274c';
    const warning = '\u26A0\uFE0F';
    const hammerAndWrench = '\u{1f6e0}\ufe0f';
    const knot = '\u{1faa2}';
    const gear = '\u2699\uFE0F';
    const backhandIndexPointingRight = '\uD83D\uDC49';
    const downArrow = '\u2B07\ufe0f';
    const manShrugging = '\uD83E\uDD37\u200D\u2642\uFE0F';
    const locked = '\u{1f512}';
    const adhesiveBandage = '\u{1FA79}';
    const triangularRedFlag = '\u{1f6a9}';
    switch (lower) {
      // Standard
      case '1':
      case 'php error': return crossMark;
      case '2':
      case 'php warning': return warning;
      case '4':
      case 'php parse': return knot;
      case '8':
      case 'php notice': return information;
      case '2048':
      case 'php strict': return locked;
      case '8192':
      case 'php deprecated': return downArrow;
      // Core
      case '16':
      case 'php core error': return gear + crossMark;
      case '32':
      case 'php core warning': return gear + warning;
      // Compile
      case '64':
      case 'php compile error': return hammerAndWrench + crossMark;
      case '128':
      case 'php compile warning': return hammerAndWrench + warning;
      // Recoverable
      case '4096':
      case 'php recoverable error': return warning + adhesiveBandage;
      // Fatal
      case 'php fatal error': return squaredSos;
      // User
      case '256':
      case 'php user error': return backhandIndexPointingRight + crossMark;
      case '512':
      case 'php user warning': return backhandIndexPointingRight + warning;
      case '1024':
      case 'php user notice': return backhandIndexPointingRight + information;
      case '16384':
      case 'php user deprecated': return backhandIndexPointingRight + downArrow;
      // Exception Handler / misc
      default:
        if (lower.endsWith("error")) {
          return triangularRedFlag;
        }
        return manShrugging;
    }
  }
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadData(this.currentPage);
    }
  }

  previousPage() {
    this.currentPage--;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage <= 0) {
      this.currentPage = 1;
    }
    this.loadData(this.currentPage);
  }
}

export class LogsModule { };