import { Injectable, HttpException } from '@nestjs/common';

import { AccountDto } from './account.dto';
import { TransactionsDto } from '../transactions/transactions.dto';

import { ACCOUNTS } from './accounts';
import { TRANSACTIONS } from '../transactions/transactions';
import { invalidString } from '../utils/dataValidation';
import { Account } from './Account';
import { Transaction } from '../transactions/Transaction';

@Injectable()
export class AccountsService {
  private accounts: AccountDto[] = ACCOUNTS;
  private transactions: TransactionsDto[] = TRANSACTIONS;

  readonly MIN_TRANSACTION_AMOUNT = 1;
  readonly MAX_TRANSACTION_AMOUNT = 1000;

  public getAccount(id: string) {
    const acc = this.accounts.find((e) => e.id === id);
    if (!acc) throw new HttpException('Not Found', 404);
    return acc;
  }

  public getAccounts() {
    return this.accounts;
  }

  public createAccount(acc: AccountDto) {
    // Data validation
    const Acc = new Account(acc);
    const { valid, missingFields, invalidFields } = Acc.valid();

    if (missingFields?.length || invalidFields?.length) {
      const mf = missingFields?.length
        ? `Missing required field(s): ${missingFields?.join(', ')}`
        : '';

      const invF = invalidFields?.length
        ? `Invalid field(s): ${invalidFields?.join(', ')}`
        : '';

      throw new HttpException(
        missingFields?.length && invalidFields?.length
          ? `${mf} ${invF}`
          : mf + invF,
        400,
      );
    } else if (!valid)
      throw new HttpException('Missing account information', 400);

    // Make sure id is unique
    if (!Acc.unique) throw new HttpException('Id already exists', 403);

    const { error } = Acc.save();
    if (error) throw new HttpException('Failed to save account', 500);
    return 'Done';
  }

  public getAccountTransactions(id: string) {
    if (invalidString(id)) throw new HttpException('Invalid account', 400);

    // Make sure account exists
    if (!new Account().exists(id))
      throw new HttpException('Account Not Found', 404);

    return this.transactions.filter(
      (e) => e.account_id === id || e.target_account_id === id,
    );
  }

  // Does not take into consideration currency exchange rates
  public deposit(account_id: string, transaction: TransactionsDto) {
    // Data validation
    const trans = new Transaction({ ...transaction, account_id });
    const { valid, invalidFields, missingFields } = trans.valid();

    if (missingFields?.length || invalidFields?.length) {
      const mf = missingFields?.length
        ? `Missing required field(s): ${missingFields?.join(', ')}`
        : '';

      const invF = invalidFields?.length
        ? `Invalid field(s): ${invalidFields?.join(', ')}`
        : '';

      throw new HttpException(
        missingFields?.length && invalidFields?.length
          ? `${mf} ${invF}`
          : mf + invF,
        400,
      );
    } else if (!valid)
      throw new HttpException('Missing transaction information', 400);

    // Make sure id is unique
    if (!trans.unique)
      throw new HttpException('A transaction with this id already exists', 403);

    // Make sure account exists
    const acc_index = this.accounts.findIndex((e) => e.id === account_id);
    if (acc_index < 0) throw new HttpException('Account Not Fount', 404);

    // Add money to account
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
    this.transactions.push({
      id: transaction.id,
      note: transaction.note,
      account_id,
      amount_money: {
        amount: transaction.amount_money?.amount,
        currency: transaction.amount_money?.currency,
      },
    });

    return 'Done';
  }

  // Does not take into consideration currency exchange rates
  public withdraw(account_id: string, config: TransactionsDto) {
    // Data validation
    const trans = new Transaction({ ...config, account_id });
    const { valid, invalidFields, missingFields } = trans.valid();

    if (missingFields?.length || invalidFields?.length) {
      const mf = missingFields?.length
        ? `Missing required field(s): ${missingFields?.join(', ')}`
        : '';

      const invF = invalidFields?.length
        ? `Invalid field(s): ${invalidFields?.join(', ')}`
        : '';

      throw new HttpException(
        missingFields?.length && invalidFields?.length
          ? `${mf} ${invF}`
          : mf + invF,
        400,
      );
    } else if (!valid)
      throw new HttpException('Missing transaction information', 400);

    // Make sure new transaction id is unique
    if (!trans.unique)
      throw new HttpException('A transaction with this id already exists', 403);

    // Make sure account exists
    const account = this.accounts.find((e) => e.id === account_id);
    if (!account) throw new HttpException('Account Not Found', 404);

    // Make sure account has enough money to withdraw
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
    trans.save();

    return 'Done';
  }

  // Does not take into consideration currency exchange rates
  public send(account_id: string, config: TransactionsDto) {
    // Data validation
    const trans = new Transaction({ ...config, account_id });
    const { valid, invalidFields, missingFields } = trans.valid();

    if (missingFields?.length || invalidFields?.length) {
      const mf = missingFields?.length
        ? `Missing required field(s): ${missingFields?.join(', ')}`
        : '';

      const invF = invalidFields?.length
        ? `Invalid field(s): ${invalidFields?.join(', ')}`
        : '';

      throw new HttpException(
        missingFields?.length && invalidFields?.length
          ? `${mf} ${invF}`
          : mf + invF,
        400,
      );
    } else if (!valid)
      throw new HttpException('Missing transaction information', 400);

    // Make sure transaction id is unique
    if (!trans.unique)
      throw new HttpException('A transaction with this id already exists', 403);

    // Make sure transaction amount is in range
    const amount = config.amount_money.amount;
    if (
      amount > this.MAX_TRANSACTION_AMOUNT ||
      amount < this.MIN_TRANSACTION_AMOUNT
    )
      throw new HttpException('Transaction amount out of bounds', 400);

    // Make sure target account exists
    const targetAccount = this.accounts.find(
      (e) => e.id === config.target_account_id,
    );
    if (!targetAccount)
      throw new HttpException('Target account not found', 404);

    // Make sure target account is not source account
    if (account_id === config.target_account_id)
      throw new HttpException('Target account cannot be source account', 400);

    // Make sure source account exists
    const sourceAccount = this.accounts.find((e) => e.id === account_id);
    if (!sourceAccount)
      throw new HttpException('Source account not found', 404);

    // Make sure source account has enough funds
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
    trans.save();

    return 'Done';
  }
} // End class
