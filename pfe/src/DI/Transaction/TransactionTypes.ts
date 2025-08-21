import { ITransaction } from '../../Interfaces/transaction/ITransaction';
import { Document, Types } from 'mongoose';

export const TransactionTYPES = {
    transactionService: Symbol.for("TransactionService"),
    transactionController: Symbol.for("TransactionController"),
};

// Not directly related to DI, custom type alias
type CommonTransactionType = Document<unknown, any, ITransaction> & ITransaction & {
    _id: Types.ObjectId;
};

export type getTransactionsReturnType = Promise<CommonTransactionType[] | undefined>;

export type returnTransactionType = Promise<CommonTransactionType | string | undefined>;

export enum SORT_TRANSACTION_OPT {
    status = "status",
    amount = "amount",
    date = "date"
}
