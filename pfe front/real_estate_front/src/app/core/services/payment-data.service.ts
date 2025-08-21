import { Injectable } from '@angular/core';
import { Property } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentDataService {
  private paymentData: {
    property: Property;
    reservation: any;
    totalAmount: number;
    clientSecret: string;
    paymentIntentId: string;
  } | null = null;

  set(data: {
    property: Property;
    reservation: any;
    totalAmount: number;
    clientSecret: string;
    paymentIntentId: string;
  }) {
    this.paymentData = data;
  }

  get() {
    return this.paymentData;
  }

  clear() {
    this.paymentData = null;
  }
}
