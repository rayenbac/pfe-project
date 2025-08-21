# Payment Controller Fix - userId Property Error

## Problem
The payment controller was trying to access a `userId` property on the payment object, but the `IPayment` interface doesn't have a `userId` property. Instead, it has a `transactionId` which references a transaction that contains the buyer (user) information.

## Error Messages
```
src/Controllers/payment.controller.ts:61:47 - error TS2339: Property 'userId' does not exist on type 'IPayment & Required<{ _id: ObjectId; }>'.
src/Controllers/payment.controller.ts:63:25 - error TS2339: Property 'userId' does not exist on type 'IPayment & Required<{ _id: ObjectId; }>'.
```

## Root Cause
The `IPayment` interface structure:
```typescript
export interface IPayment extends Document {
    _id: Types.ObjectId;
    transactionId: Types.ObjectId;  // References transaction, not direct user
    amount: number;
    currency: string;
    method: 'credit_card' | 'bank_transfer' | 'paypal';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    // ... no userId property
}
```

The `ITransaction` interface has the user reference:
```typescript
export interface ITransaction extends Document {
    _id: Types.ObjectId;
    buyer: Types.ObjectId;      // This is the user
    seller: Types.ObjectId;
    property: Types.ObjectId;
    // ...
}
```

## Solution Applied

### 1. Updated Payment Service
Modified `updatePaymentStatus` method to populate the transaction and buyer information:

```typescript
// Before
async updatePaymentStatus(id: string, status: 'completed' | 'failed' | 'refunded') {
    const payment = await Payment.findByIdAndUpdate(
        id,
        { status, ...(status === 'completed' ? { paymentDate: new Date() } : {}) },
        { new: true }
    );
    return payment;
}

// After
async updatePaymentStatus(id: string, status: 'completed' | 'failed' | 'refunded') {
    const payment = await Payment.findByIdAndUpdate(
        id,
        { status, ...(status === 'completed' ? { paymentDate: new Date() } : {}) },
        { new: true }
    ).populate({
        path: 'transactionId',
        populate: {
            path: 'buyer',
            select: '_id firstName lastName email'
        }
    });
    return payment;
}
```

### 2. Updated Payment Controller
Modified the notification trigger to use the populated transaction data:

```typescript
// Before (causing error)
if (status === 'completed' && payment.userId && realtimeNotificationService) {
    await realtimeNotificationService.notifyPaymentConfirmed(
        payment.userId.toString(),  // Error: userId doesn't exist
        payment._id.toString(),
        payment.amount
    );
}

// After (fixed)
if (status === 'completed' && payment.transactionId && realtimeNotificationService) {
    try {
        const transaction = payment.transactionId as any;
        if (transaction && transaction.buyer && transaction.buyer._id) {
            await realtimeNotificationService.notifyPaymentConfirmed(
                transaction.buyer._id.toString(),  // Correct path to user ID
                payment._id.toString(),
                payment.amount
            );
        }
    } catch (error) {
        console.error('Error sending payment notification:', error);
    }
}
```

## Files Modified
- ✅ `src/Services/payment.service.ts` - Added population of transaction and buyer
- ✅ `src/Controllers/payment.controller.ts` - Fixed notification trigger to use correct data path

## Verification
The payment controller should now:
1. Compile without TypeScript errors
2. Successfully send payment confirmation notifications to the correct user
3. Handle cases where transaction or buyer data might be missing

## Data Flow
```
Payment → transactionId (populated) → Transaction → buyer (populated) → User
```

This ensures that when a payment is completed, the notification is sent to the buyer (user) who made the payment.
