import { IPayment } from '../../Interfaces/payment/IPayment';
import { Document, Types } from 'mongoose';

export const PaymentTYPES = {
    paymentService: Symbol.for("PaymentService"),
    paymentController: Symbol.for("PaymentController"),
};

export type CommonPaymentType = Document<unknown, any, IPayment> & IPayment & {
    _id: Types.ObjectId;
};

export type getPaymentsReturnType = Promise<CommonPaymentType[] | undefined>;
export type returnPaymentType = Promise<CommonPaymentType | string | undefined>;