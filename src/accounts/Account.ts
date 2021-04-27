import { notObject, invalidString } from '../utils/dataValidation';
import { AccountDto } from './account.dto';
import { ACCOUNTS } from './accounts';

export class Account {
  private _accounts = ACCOUNTS;

  _initialized = false;
  _valid = false;
  _unique = false;

  private _id: string;
  private _given_name: string;
  private _family_name: string;
  private _email_address: string;
  private _note: string;
  private _balance: {
    amount: number;
    currency: string;
  };

  constructor(acc?: AccountDto) {
    if (!acc) return;

    // Data validation
    this._id = acc?.id;
    this._given_name = acc?.given_name;
    this._family_name = acc?.family_name;
    this._email_address = acc?.email_address;
    this._note = acc?.note;
    this._balance = acc?.balance;

    this._valid = this.valid().valid;
    this._unique = this.isUnique(acc?.id);
    this._initialized = true;
  }

  public valid(): {
    valid: boolean;
    missingFields?: string[];
    invalidFields?: string[];
  } {
    const acc = {
      id: this._id,
      given_name: this._given_name,
      family_name: this._family_name,
      email_address: this._email_address,
      note: this._note,
      balance: this._balance,
    };

    const fields = [
      { key: 'given_name', type: 'string', optional: true },
      { key: 'family_name', type: 'string', optional: true },
      { key: 'email_address', type: 'string', optional: true },
      { key: 'id', type: 'string', optional: false },
      { key: 'balance', type: 'object', optional: true },
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
            return invalidString(acc[e.key]);
          case 'object':
            return notObject(acc[e.key]);
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
      return { valid: false, invalidFields, missingFields };
    }

    return { valid: true };
  }

  public isUnique(id: string) {
    if (invalidString(id)) return false;
    return this._accounts.every((e) => e.id !== id);
  }

  public exists(id: string) {
    if (invalidString(id)) return false;
    return this._accounts.some((e) => e.id === id);
  }
}
