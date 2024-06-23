/* eslint-disable no-console */
import { Component, OnInit, Input } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { LogDatesService } from './logDates.service';
import { LogDateData } from './LogDateData';
@Component({
  selector: 'app-log-dates',
  templateUrl: './logDates.component.html',
  styleUrls: ['./logDates.component.scss'],
  imports: [NgFor, CommonModule],
  standalone: true
})
export class LogDatesComponent implements OnInit {
  @Input() id!: string;
  data: LogDateData[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 100;
  totalPages: number = 0;

  constructor(private logDatesService: LogDatesService) {
  }

  ngOnInit() {
    this.loadData(this.currentPage);
  }
  graphDates() {
    if (this.data.length < 3) return "";
    const minTime = this.data.reduce((min, { first_at }) => Math.min(first_at, min), this.data[0].first_at);
    const maxTime = this.data.reduce((max, { last_at }) => Math.max(last_at, max), this.data[0].last_at);
    const timeRange = maxTime - minTime;
    let maxCount = this.data.reduce((max, { count }) => Math.max(count, max), this.data[0].count);
    let minCount = this.data.reduce((min, { count }) => Math.min(count, min), this.data[0].count);
    let countRange = maxCount - minCount;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx === null) return '';
    const width = 400;
    const gap = 10;
    const height = gap * 2;
    canvas.width = width;
    canvas.height = height;

    const getX = (date: number) => gap + (((date - minTime) / timeRange) * (width - gap * 2));
    const getLineWidth = (count: number) => {
      const minSize = gap / 10;
      const maxSize = gap / 4;
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
    this.data.forEach(({
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

  loadData(pageNumber: number) {
    this.logDatesService.getPage(this.id, pageNumber, this.pageSize)
      .subscribe(response => {
        this.data = response.data;
        this.totalItems = response.total;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      });
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
