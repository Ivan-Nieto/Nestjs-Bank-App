import { Injectable, HttpException } from '@nestjs/common';
import { AccountDto } from './account.dto';
import ACCOUNTS from './accounts';
import { TRANSACTIONS } from './transactions';

@Injectable()
export class AccountsService {
  private accounts: AccountDto[] = ACCOUNTS;
  private transactions = TRANSACTIONS;

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
} // End class
