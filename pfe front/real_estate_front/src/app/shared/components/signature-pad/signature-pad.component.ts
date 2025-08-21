import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="signature-pad-container">
      <div class="signature-options">
        <div class="btn-group" role="group">
          <button 
            type="button" 
            class="btn"
            [class.btn-primary]="signatureType === 'drawn'"
            [class.btn-outline-primary]="signatureType !== 'drawn'"
            (click)="setSignatureType('drawn')">
            <i class="fas fa-pencil-alt"></i> Draw
          </button>
          <button 
            type="button" 
            class="btn"
            [class.btn-primary]="signatureType === 'typed'"
            [class.btn-outline-primary]="signatureType !== 'typed'"
            (click)="setSignatureType('typed')">
            <i class="fas fa-keyboard"></i> Type
          </button>
          <button 
            type="button" 
            class="btn"
            [class.btn-primary]="signatureType === 'uploaded'"
            [class.btn-outline-primary]="signatureType !== 'uploaded'"
            (click)="setSignatureType('uploaded')">
            <i class="fas fa-upload"></i> Upload
          </button>
        </div>
      </div>

      <!-- Draw Signature -->
      <div *ngIf="signatureType === 'drawn'" class="signature-draw-area">
        <div class="signature-canvas-container">
          <canvas 
            #signatureCanvas
            [width]="canvasWidth"
            [height]="canvasHeight"
            class="signature-canvas"
            (mousedown)="startDrawing($event)"
            (mousemove)="draw($event)"
            (mouseup)="stopDrawing()"
            (mouseleave)="stopDrawing()"
            (touchstart)="startDrawing($event)"
            (touchmove)="draw($event)"
            (touchend)="stopDrawing()">
          </canvas>
          <div class="signature-placeholder" *ngIf="!isDrawing && isEmpty">
            <i class="fas fa-signature"></i>
            <span>Sign here</span>
          </div>
        </div>
        <div class="signature-controls">
          <button type="button" class="btn btn-outline-secondary" (click)="clearSignature()">
            <i class="fas fa-eraser"></i> Clear
          </button>
        </div>
      </div>

      <!-- Type Signature -->
      <div *ngIf="signatureType === 'typed'" class="signature-type-area">
        <div class="form-group">
          <label for="signatureText">Type your full name:</label>
          <input 
            type="text" 
            id="signatureText"
            class="form-control" 
            [(ngModel)]="typedSignature"
            placeholder="Enter your full name"
            (input)="updateTypedSignature()">
        </div>
        <div class="form-group">
          <label for="fontFamily">Choose font style:</label>
          <select 
            id="fontFamily"
            class="form-control" 
            [(ngModel)]="selectedFont"
            (change)="updateTypedSignature()">
            <option value="Dancing Script">Dancing Script</option>
            <option value="Great Vibes">Great Vibes</option>
            <option value="Allura">Allura</option>
            <option value="Alex Brush">Alex Brush</option>
            <option value="Amatic SC">Amatic SC</option>
          </select>
        </div>
        <div class="signature-preview" *ngIf="typedSignature">
          <div 
            class="typed-signature" 
            [style.font-family]="selectedFont"
            [style.font-size]="'32px'"
            [style.color]="'#000'">
            {{ typedSignature }}
          </div>
        </div>
      </div>

      <!-- Upload Signature -->
      <div *ngIf="signatureType === 'uploaded'" class="signature-upload-area">
        <div class="upload-zone" 
             [class.dragover]="isDragOver"
             (drop)="onFileDropped($event)"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (click)="fileInput.click()">
          <div class="upload-content" *ngIf="!uploadedSignature">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Drop signature image here or click to upload</p>
            <small>Supported formats: PNG, JPG, GIF (Max 2MB)</small>
          </div>
          <img *ngIf="uploadedSignature" [src]="uploadedSignature" alt="Uploaded signature" class="uploaded-signature-preview">
        </div>
        <input 
          #fileInput
          type="file" 
          accept="image/*"
          (change)="onFileSelected($event)"
          style="display: none;">
        <button 
          *ngIf="uploadedSignature"
          type="button" 
          class="btn btn-outline-secondary mt-2" 
          (click)="clearUploadedSignature()">
          <i class="fas fa-trash"></i> Remove
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="signature-actions mt-3">
        <button 
          type="button" 
          class="btn btn-primary"
          [disabled]="!hasValidSignature()"
          (click)="saveSignature()">
          <i class="fas fa-save"></i> {{ actionButtonText }}
        </button>
        <button 
          type="button" 
          class="btn btn-outline-secondary ml-2"
          (click)="cancelSignature()">
          <i class="fas fa-times"></i> Cancel
        </button>
      </div>
    </div>
  `,
  styles: [`
    .signature-pad-container {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      background: white;
    }

    .signature-options {
      margin-bottom: 20px;
    }

    .signature-canvas-container {
      position: relative;
      border: 2px dashed #ccc;
      border-radius: 8px;
      background: #fafafa;
    }

    .signature-canvas {
      display: block;
      cursor: crosshair;
      border-radius: 6px;
    }

    .signature-placeholder {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #999;
      text-align: center;
      pointer-events: none;
    }

    .signature-placeholder i {
      font-size: 24px;
      margin-bottom: 8px;
      display: block;
    }

    .signature-controls {
      margin-top: 10px;
      text-align: center;
    }

    .signature-type-area .form-group {
      margin-bottom: 15px;
    }

    .signature-preview {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 20px;
      background: white;
      text-align: center;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .typed-signature {
      font-weight: bold;
    }

    .upload-zone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafafa;
    }

    .upload-zone:hover,
    .upload-zone.dragover {
      border-color: #007bff;
      background: #f8f9ff;
    }

    .upload-content i {
      font-size: 48px;
      color: #ccc;
      margin-bottom: 15px;
    }

    .upload-content p {
      margin-bottom: 5px;
      font-weight: 500;
    }

    .upload-content small {
      color: #666;
    }

    .uploaded-signature-preview {
      max-width: 100%;
      max-height: 150px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .signature-actions {
      border-top: 1px solid #eee;
      padding-top: 15px;
      text-align: right;
    }

    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Allura&family=Alex+Brush&family=Amatic+SC:wght@400;700&display=swap');
  `]
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @Input() actionButtonText: string = 'Save Signature';
  @Input() required: boolean = true;
  @Input() existingSignature?: any; // For editing existing signatures
  @Output() signatureSaved = new EventEmitter<any>();
  @Output() signatureCanceled = new EventEmitter<void>();

  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  signatureType: 'drawn' | 'typed' | 'uploaded' = 'drawn';
  canvasWidth = 400;
  canvasHeight = 200;
  
  // Drawing state
  isDrawing = false;
  isEmpty = true;
  context!: CanvasRenderingContext2D;
  
  // Typed signature
  typedSignature = '';
  selectedFont = 'Dancing Script';
  
  // Uploaded signature
  uploadedSignature: string | null = null;
  isDragOver = false;

  ngAfterViewInit() {
    this.initializeCanvas();
    this.loadExistingSignature();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  private initializeCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      this.context = canvas.getContext('2d')!;
      this.context.strokeStyle = '#000';
      this.context.lineWidth = 2;
      this.context.lineCap = 'round';
      this.context.lineJoin = 'round';
      
      // Set canvas background to white
      this.context.fillStyle = '#ffffff';
      this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  }

  private loadExistingSignature() {
    if (this.existingSignature) {
      this.signatureType = this.existingSignature.signatureType || 'drawn';
      
      if (this.signatureType === 'typed') {
        this.typedSignature = this.existingSignature.signatureText || '';
        this.selectedFont = this.existingSignature.signatureFont || 'Dancing Script';
      } else if (this.existingSignature.signatureImage) {
        if (this.signatureType === 'drawn') {
          this.loadImageToCanvas(this.existingSignature.signatureImage);
        } else if (this.signatureType === 'uploaded') {
          this.uploadedSignature = this.existingSignature.signatureImage;
        }
      }
    }
  }

  private loadImageToCanvas(imageData: string) {
    const img = new Image();
    img.onload = () => {
      this.context.drawImage(img, 0, 0, this.canvasWidth, this.canvasHeight);
      this.isEmpty = false;
    };
    img.src = imageData;
  }

  setSignatureType(type: 'drawn' | 'typed' | 'uploaded') {
    this.signatureType = type;
    this.clearAllSignatures();
  }

  private clearAllSignatures() {
    // Clear canvas
    if (this.context) {
      this.context.fillStyle = '#ffffff';
      this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.isEmpty = true;
    }
    
    // Clear typed signature
    this.typedSignature = '';
    
    // Clear uploaded signature
    this.uploadedSignature = null;
  }

  // Canvas drawing methods
  startDrawing(event: MouseEvent | TouchEvent) {
    if (this.signatureType !== 'drawn') return;
    
    this.isDrawing = true;
    this.isEmpty = false;
    
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = this.getEventX(event) - rect.left;
    const y = this.getEventY(event) - rect.top;
    
    this.context.beginPath();
    this.context.moveTo(x, y);
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing || this.signatureType !== 'drawn') return;
    
    event.preventDefault();
    
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = this.getEventX(event) - rect.left;
    const y = this.getEventY(event) - rect.top;
    
    this.context.lineTo(x, y);
    this.context.stroke();
  }

  stopDrawing() {
    if (this.signatureType !== 'drawn') return;
    this.isDrawing = false;
    this.context.beginPath();
  }

  private getEventX(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  }

  private getEventY(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  }

  clearSignature() {
    this.clearAllSignatures();
  }

  // Typed signature methods
  updateTypedSignature() {
    // This is called when the typed signature or font changes
  }

  // File upload methods
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.processUploadedFile(file);
    }
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processUploadedFile(files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  private processUploadedFile(file: File) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedSignature = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  clearUploadedSignature() {
    this.uploadedSignature = null;
  }

  // Validation
  hasValidSignature(): boolean {
    switch (this.signatureType) {
      case 'drawn':
        return !this.isEmpty;
      case 'typed':
        return this.typedSignature.trim().length > 0;
      case 'uploaded':
        return this.uploadedSignature !== null;
      default:
        return false;
    }
  }

  // Action methods
  saveSignature() {
    if (!this.hasValidSignature()) {
      return;
    }

    let signatureData: any = {
      signatureType: this.signatureType
    };

    switch (this.signatureType) {
      case 'drawn':
        signatureData.signatureImage = this.canvasRef.nativeElement.toDataURL('image/png');
        break;
      case 'typed':
        signatureData.signatureText = this.typedSignature;
        signatureData.signatureFont = this.selectedFont;
        // Generate image from typed signature
        signatureData.signatureImage = this.generateTypedSignatureImage();
        break;
      case 'uploaded':
        signatureData.signatureImage = this.uploadedSignature;
        break;
    }

    this.signatureSaved.emit(signatureData);
  }

  private generateTypedSignatureImage(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    
    // Set background to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set text properties
    ctx.fillStyle = '#000000';
    ctx.font = `32px "${this.selectedFont}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text
    ctx.fillText(this.typedSignature, canvas.width / 2, canvas.height / 2);
    
    return canvas.toDataURL('image/png');
  }

  cancelSignature() {
    this.signatureCanceled.emit();
  }
}
