import { Injectable } from '@nestjs/common';

import { TransactionsDto } from './transactions.dto';

import { TRANSACTIONS } from './transactions';

@Injectable()
export class TransactionsService {
  transactions: TransactionsDto[] = TRANSACTIONS;

  public getTransactions() {
    return this.transactions;
  }
}
