/* eslint-disable no-console */
import { Component, OnInit, Input } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { LogDetailsService } from './logDetails.service';
import { LogDetailData } from './LogDetailData';
@Component({
  selector: 'app-log-details',
  templateUrl: './logDetails.component.html',
  styleUrls: ['./logDetails.component.scss'],
  imports: [NgFor, CommonModule],
  standalone: true
})
export class LogDetailsComponent implements OnInit {
  @Input() id!: string;
  data: LogDetailData[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 100;
  totalPages: number = 0;

  constructor(private logDetailsService: LogDetailsService) {
  }

  ngOnInit() {
    this.loadData(this.currentPage);
  }

  loadData(pageNumber: number) {
    this.logDetailsService.getPage(this.id, pageNumber, this.pageSize)
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
