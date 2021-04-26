import { Injectable, HttpException } from '@nestjs/common';

import { AccountDto } from './account.dto';
import { TransactionsDto } from '../transactions/transactions.dto';

import { ACCOUNTS } from './accounts';
import { TRANSACTIONS } from '../transactions/transactions';

@Injectable()
export class AccountsService {
  private accounts: AccountDto[] = ACCOUNTS;
  private transactions: TransactionsDto[] = TRANSACTIONS;

  private MIN_TRANSACTION_AMOUNT = 1;
  private MAX_TRANSACTION_AMOUNT = 1000;

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

    if (!acc || typeof acc != 'object' || Array.isArray(acc))
      throw new HttpException('Missing account information', 400);

    const fields = [
      { key: 'given_name', type: 'string' },
      { key: 'family_name', type: 'string' },
      { key: 'email_address', type: 'string' },
      { key: 'id', type: 'string' },
      { key: 'balance', type: 'object' },
      { key: 'note', type: 'string', optional: true },
    ];

    // Make sure required fields where provided
    const missingFields = fields
      .filter((e) => !Boolean(acc[e.key]) && !e.optional)
      .map((e) => e.key);

    // Validate field types
    const invalidFields = fields
      .filter((e) => {
        if (!Boolean(acc[e.key])) return false;
        switch (e.type) {
          case 'string':
            return typeof acc[e.key] !== 'string';
          case 'object':
            return typeof acc[e.key] !== 'object' || Array.isArray(acc[e.key]);
          default:
            return true;
        }
      })
      .map((e) => e.key);

    // Validate balance object
    if (Boolean(acc.balance) && !invalidFields.includes('balance')) {
      const amount = acc.balance.amount;
      const currency = acc.balance.currency;

      if (amount == null) missingFields.push('amount');
      else if (typeof amount !== 'number') invalidFields.push('amount');

      if (currency == null) missingFields.push('currency');
      else if (currency === '' || typeof currency !== 'string')
        invalidFields.push('currency');
    }

    if (missingFields.length || invalidFields.length) {
      const mf = missingFields.length
        ? `Missing required field(s): ${missingFields.join(', ')}`
        : '';

      const invF = invalidFields.length
        ? `Invalid field(s): ${invalidFields.join(', ')}`
        : '';

      throw new HttpException(
        missingFields.length && invalidFields.length
          ? `${mf} ${invF}`
          : mf + invF,
        400,
      );
    }

    // Make sure id is unique
    if (this.accounts.some((e) => e.id === acc.id))
      throw new HttpException('Id already exists', 403);

    this.accounts.push(acc);
    return 'Done';
  }

  public getAccountTransactions(id: string) {
    if (!Boolean(id)) throw new HttpException('Not Found', 404);

    return this.transactions.filter(
      (e) => e.account_id === id || e.target_account_id === id,
    );
  }

  private notObject(obj: any) {
    return typeof obj !== 'object' || Array.isArray(obj);
  }
  // Does not take into consideration currency exchange rates
  public deposit(
    account_id: string,
    transaction: {
      id: string;
      note?: string;
      amount_money: {
        amount: number;
        currency: string;
      };
    },
  ) {
    // Data validation
    if (!Boolean(account_id) || typeof account_id !== 'string')
      throw new HttpException('Missing or invalid account_id', 400);
    if (!transaction || this.notObject(transaction))
      throw new HttpException('Invalid request', 400);

    if (!transaction.amount_money || this.notObject(transaction.amount_money))
      throw new HttpException('Invalid amount_money', 400);

    if (typeof transaction.amount_money?.amount !== 'number')
      throw new HttpException('Invalid transaction amount', 400);

    if (
      typeof transaction.amount_money?.currency !== 'string' ||
      transaction.amount_money.currency === ''
    )
      throw new HttpException('Invalid transaction currency', 400);

    // Make sure account exists
    const acc_index = this.accounts.findIndex((e) => e.id === account_id);
    if (acc_index < 0) throw new HttpException('Account Not Fount', 404);

    // Add money to account
    const account = this.accounts[acc_index];
    this.accounts[acc_index] = {
      ...account,
      balance: {
        ...account.balance,
        amount: account.balance.amount + transaction.amount_money.amount,
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
  public withdraw(
    account_id: string,
    config: { amount: number; id: string; currency: string },
  ) {
    // Data validation
    if (!Boolean(account_id) || typeof account_id !== 'string')
      throw new HttpException('Invalid account_id', 400);

    if (this.notObject(config)) throw new HttpException('Invalid request', 400);

    if (config.amount == null || typeof config.amount !== 'number')
      throw new HttpException('Invalid amount', 400);

    if (!Boolean(config.currency) || typeof config.currency !== 'string')
      throw new HttpException('Invalid currency', 400);

    if (!Boolean(config.id) || typeof config.id !== 'string')
      throw new HttpException('Invalid id', 400);

    // Make sure new transaction id is unique
    if (this.transactions.some((e) => e.id === config.id))
      throw new HttpException('A transaction with this id already exists', 403);

    // Make sure account exists
    const account = this.accounts.find((e) => e.id === account_id);
    if (!account) throw new HttpException('Account Not Found', 404);

    // Make sure account has enough money to withdraw
    if (
      !Boolean(account?.balance?.amount) ||
      account?.balance?.amount - config.amount < 0
    )
      throw new HttpException('Not Enough Funds', 400);

    // Update users account to reflect changes
    const account_index = this.accounts.findIndex((e) => e.id === account_id);
    this.accounts[account_index] = {
      ...account,
      balance: {
        ...account.balance,
        amount: account.balance.amount - config.amount,
      },
    };

    // Add transaction
    this.transactions.push({
      id: config.id,
      account_id,
      amount_money: {
        amount: config.amount,
        currency: config.currency,
      },
    });

    return 'Done';
  }

  // Does not take into consideration currency exchange rates
  public send(
    account_id: string,
    config: {
      id: string;
      note: string;
      target_account_id: string;
      amount_money: {
        amount: number;
        currency: string;
      };
    },
  ) {
    // Data validation
    const invalidString = (str?: any) => {
      return !Boolean(str) || typeof str !== 'string';
    };

    if (invalidString(account_id))
      throw new HttpException('Missing or Invalid account_id', 400);

    if (this.notObject(config)) throw new HttpException('Invalid request', 400);

    if (invalidString(config.id))
      throw new HttpException('Missing or Invalid id', 400);

    if (invalidString(config.target_account_id))
      throw new HttpException('Missing or Invalid target_account_id', 400);

    if (config.note && invalidString(config.note))
      throw new HttpException('Invalid note', 400);

    if (this.notObject(config.amount_money))
      throw new HttpException('Missing or Invalid amount_money', 400);

    if (invalidString(config.amount_money.currency))
      throw new HttpException('Missing or Invalid currency', 400);

    const amount = config.amount_money.amount;
    if (amount == null || typeof amount !== 'number')
      throw new HttpException('Missing or Invalid amount', 400);

    // Make sure transaction id is unique
    if (this.transactions.some((e) => e.id === config.id))
      throw new HttpException('A transaction with this id already exists', 403);

    // Make sure transaction amount is in range
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

    // Make sure source account exists
    const sourceAccount = this.accounts.find((e) => e.id === account_id);
    if (!sourceAccount)
      throw new HttpException('Source account not found', 404);

    // Make sure source account has enough funds
    if (sourceAccount?.balance?.amount - config.amount_money.amount < 0)
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
        amount: targetAccount.balance.amount + config.amount_money.amount,
      },
    };

    // Add transaction record
    this.transactions.push({
      id: config.id,
      account_id,
      target_account_id: config.target_account_id,
      amount_money: {
        amount: config.amount_money.amount,
        currency: config.amount_money.currency,
      },
      ...(Boolean(config.note) ? { note: config.note } : {}),
    });

    return 'Done';
  }
} // End class
