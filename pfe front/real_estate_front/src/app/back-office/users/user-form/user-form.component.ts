import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models/user.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  userId: string | null = null;
  userRoles = Object.values(UserRole);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', Validators.required],
      role: [UserRole.USER, Validators.required],
      address: [''],
      isVerified: [false]
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.isEditMode = true;
      this.loadUserData();
    }
  }

  loadUserData(): void {
    if (this.userId) {
      this.userService.getUser(this.userId).subscribe(
        (user) => {
          this.userForm.patchValue(user);
          this.userForm.get('password')?.clearValidators();
          this.userForm.get('password')?.updateValueAndValidity();
        },
        (error) => {
          console.error('Error loading user:', error);
          this.showErrorAlert('Error loading user data');
        }
      );
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const userData = this.userForm.value;
      
      if (this.isEditMode && this.userId) {
        this.userService.updateUser(this.userId, userData).subscribe(
          () => {
            this.showSuccessAlert('User updated successfully');
            this.router.navigate(['/admin/users']);
          },
          (error) => {
            console.error('Error updating user:', error);
            this.showErrorAlert('Error updating user');
          }
        );
      } else {
        this.userService.addUser(userData).subscribe(
          () => {
            this.showSuccessAlert('User created successfully');
            this.router.navigate(['/admin/users']);
          },
          (error) => {
            console.error('Error creating user:', error);
            this.showErrorAlert('Error creating user');
          }
        );
      }
    }
  }

  private showSuccessAlert(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: message
    });
  }

  private showErrorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: message
    });
  }
}