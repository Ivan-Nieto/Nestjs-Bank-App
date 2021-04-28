import { Injectable, HttpException } from '@nestjs/common';

import { AccountDto } from './account.dto';
import { TransactionsDto } from '../transactions/transactions.dto';

import { ACCOUNTS } from './accounts';
import { TRANSACTIONS } from '../transactions/transactions';
import { Account } from './Account';
import { Transaction } from '../transactions/Transaction';

@Injectable()
export class AccountsService {
  private accounts: AccountDto[] = ACCOUNTS;
  private transactions: TransactionsDto[] = TRANSACTIONS;

  readonly MIN_TRANSACTION_AMOUNT = 1;
  readonly MAX_TRANSACTION_AMOUNT = 1000;

  public getAccount(id: string) {
    return this.accounts.find((e) => e.id === id);
  }

  public getAccounts() {
    return this.accounts;
  }

  public createAccount(acc: AccountDto) {
    const { error } = new Account(acc).save();
    if (error) throw new HttpException('Failed to save account', 500);
    return 'Done';
  }

  public getAccountTransactions(id: string) {
    return this.transactions.filter(
      (e) => e.account_id === id || e.target_account_id === id,
    );
  }

  // Does not take into consideration currency exchange rates
  public deposit(account_id: string, transaction: TransactionsDto) {
    const trans = new Transaction({ ...transaction, account_id });

    // Add money to account
    const acc_index = this.accounts.findIndex((e) => e.id === account_id);
    const account = this.accounts[acc_index];
    this.accounts[acc_index] = {
      ...account,
      balance: {
        ...account.balance,
        currency:
          account.balance?.currency || transaction?.amount_money?.currency,
        amount:
          (account.balance?.amount || 0) + transaction.amount_money.amount,
      },
    };

    // Add new transaction
    const { error } = trans.save();
    if (error) {
      // Revert account
      this.accounts[acc_index] = account;
      throw new HttpException('Failed to save transaction', 500);
    }
    return 'Done';
  }

  // Does not take into consideration currency exchange rates
  public withdraw(account_id: string, config: TransactionsDto) {
    const trans = new Transaction({ ...config, account_id });

    // Make sure account has enough money to withdraw
    const account = this.accounts.find((e) => e.id === account_id);
    if (
      !Boolean(account?.balance?.amount) ||
      account?.balance?.amount - config.amount_money.amount < 0
    )
      throw new HttpException('Not Enough Funds', 400);

    // Update users account to reflect changes
    const account_index = this.accounts.findIndex((e) => e.id === account_id);
    this.accounts[account_index] = {
      ...account,
      balance: {
        ...account.balance,
        amount: account.balance.amount - config.amount_money.amount,
      },
    };

    // Add transaction
    const { error } = trans.save();
    if (error) {
      // Revert account
      this.accounts[account_index] = account;
      throw new HttpException('Failed to save transaction', 500);
    }

    return 'Done';
  }

  // Does not take into consideration currency exchange rates
  public send(account_id: string, config: TransactionsDto) {
    const trans = new Transaction({ ...config, account_id });

    // Make sure transaction amount is in range
    const amount = config.amount_money.amount;
    if (
      amount > this.MAX_TRANSACTION_AMOUNT ||
      amount < this.MIN_TRANSACTION_AMOUNT
    )
      throw new HttpException('Transaction amount out of bounds', 400);

    // Make sure target account is not source account
    const targetAccount = this.accounts.find(
      (e) => e.id === config.target_account_id,
    );
    if (account_id === config.target_account_id)
      throw new HttpException('Target account cannot be source account', 400);

    // Make sure source account has enough funds
    const sourceAccount = this.accounts.find((e) => e.id === account_id);
    if ((sourceAccount?.balance?.amount || 0) - config.amount_money.amount < 0)
      throw new HttpException('Not enough funds', 400);

    // Update source account
    const sourceAccountIndex = this.accounts.findIndex(
      (e) => e.id === account_id,
    );
    this.accounts[sourceAccountIndex] = {
      ...sourceAccount,
      balance: {
        ...sourceAccount.balance,
        amount: sourceAccount.balance.amount - config.amount_money.amount,
      },
    };

    // Update target account
    const targetAccountIndex = this.accounts.findIndex(
      (e) => e.id === config.target_account_id,
    );
    this.accounts[targetAccountIndex] = {
      ...targetAccount,
      balance: {
        ...targetAccount.balance,
        currency:
          targetAccount.balance?.currency || config.amount_money.currency,
        amount:
          (targetAccount.balance?.amount || 0) + config.amount_money.amount,
      },
    };

    // Add transaction record
    const { error } = trans.save();
    if (error) {
      // Revert both accounts
      this.accounts[sourceAccountIndex] = sourceAccount;
      this.accounts[targetAccountIndex] = targetAccount;
      throw new HttpException('Failed to save transaction', 500);
    }

    return 'Done';
  }
} // End class
