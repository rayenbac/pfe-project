import { Component, EventEmitter, Output, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

declare const google: any;

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent {
  @Output() close = new EventEmitter<void>();
  @ViewChild('modal', { static: false }) modal!: ElementRef;

  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotPasswordForm: FormGroup;
  isLoginMode = true;
  isForgotPasswordMode = false;
  loading = false;
  isVisible = false;
  private triggerElement: HTMLElement | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phone: [''],
      isAgent: [false]
    }, {
      validators: this.passwordMatchValidator
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }

  show(triggerElement?: HTMLElement): void {
    this.isVisible = true;
    this.triggerElement = triggerElement || null;
    
    // Use setTimeout to ensure the modal is in the DOM before focusing
    setTimeout(() => {
      if (this.modal?.nativeElement) {
        this.modal.nativeElement.focus();
      }
    }, 0);
  }

  closeModal(): void {
    this.isVisible = false;
    this.loginForm.reset();
    this.registerForm.reset();
    this.forgotPasswordForm.reset();
    this.isLoginMode = true;
    this.isForgotPasswordMode = false;
    this.loading = false;
    if (this.triggerElement) {
      this.triggerElement.focus(); // Return focus to the trigger
      this.triggerElement = null;
    }
    this.close.emit();
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Logged In',
          text: 'You have successfully logged in!',
          timer: 1500,
        });
        this.closeModal();
        window.location.reload(); // Reload to update UI based on login state
      },
      error: (error) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: error.error?.message || 'Invalid email or password',
        });
      },
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      return;
    }

    const { firstName, lastName, email, password, phone, isAgent } = this.registerForm.value;
    const role = isAgent ? 'agent' : 'user';

    this.loading = true;

    this.authService.register(firstName, lastName, email, password, phone, role).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Registered',
          text: 'You have successfully registered! Please log in.',
          timer: 1500,
        });
        this.isLoginMode = true;
        this.isForgotPasswordMode = false;
        this.registerForm.reset();
      },
      error: (error) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: error.error?.message || 'Something went wrong',
        });
      },
    });
  }

  onForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.loading = true;
    const { email } = this.forgotPasswordForm.value;
    const frontendUrl = window.location.origin;

    this.authService.forgotPassword(email, frontendUrl).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Email Sent',
          text: 'Password reset instructions have been sent to your email.',
          timer: 3000,
        });
        this.isLoginMode = true;
        this.isForgotPasswordMode = false;
        this.forgotPasswordForm.reset();
      },
      error: (error) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Request Failed',
          text: error.error?.message || 'Failed to send reset email',
        });
      },
    });
  }

  showForgotPasswordForm(): void {
    this.isForgotPasswordMode = true;
    this.isLoginMode = false;
  }

  backToLogin(): void {
    this.isForgotPasswordMode = false;
    this.isLoginMode = true;
  }

  redirectToGoogle() {
    window.location.href = 'http://localhost:3000/api/auth/google';
  }
}