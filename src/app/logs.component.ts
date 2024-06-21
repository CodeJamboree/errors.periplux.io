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