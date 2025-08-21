import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-failure',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './failure.component.html',
  styleUrls: ['./failure.component.css']
})
export class FailureComponent implements OnInit {
  paymentRef: string | null = null;
  status: string | null = null;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.paymentRef = params['ref'] || params['payment_ref'] || null;
      this.status = params['status'] || null;
      this.error = params['error'] || null;
    });
  }

  goToProperties(): void {
    this.router.navigate(['/properties']);
  }

  retry(): void {
    window.location.href = '/';
  }
} 