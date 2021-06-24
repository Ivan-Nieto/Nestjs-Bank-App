import { notObject, invalidString } from '../utils/dataValidation';
import { AccountDto } from './account.dto';
import { ACCOUNTS } from './accounts';

export class Account {
  private accounts: AccountDto[] = ACCOUNTS;

  private _initialized = false;
  private _isValid = false;
  private _unique = false;

  private _id: string;
  private _given_name: string;
  private _family_name: string;
  private _email_address: string;
  private _note: string;
  private _balance: {
    amount: number;
    currency: string;
  };

  constructor(acc?: Partial<AccountDto>) {
    if (!acc) return;

    // Data validation
    this._id = acc?.id;
    this._given_name = acc?.given_name;
    this._family_name = acc?.family_name;
    this._email_address = acc?.email_address;
    this._note = acc?.note;
    this._balance = acc?.balance;

    this._isValid = this.valid().valid;
    this._unique = this.isUnique(acc?.id);
    this._initialized = true;
  }

  get initialized(): boolean {
    return this._initialized;
  }
  get isValid(): boolean {
    return this._isValid;
  }
  get unique(): boolean {
    return this._unique;
  }
  get id(): string | undefined {
    return this._id;
  }
  get given_name(): string | undefined {
    return this._given_name;
  }
  get family_name(): string | undefined {
    return this._family_name;
  }
  get email_address(): string | undefined {
    return this._email_address;
  }
  get note(): string | undefined {
    return this._note;
  }
  get balance():
    | undefined
    | {
        amount: number;
        currency: string;
      } {
    return this._balance;
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

    return {
      valid: !Boolean(invalidFields.length || missingFields.length),
      invalidFields,
      missingFields,
    };
  }

  public isUnique(id: string) {
    if (invalidString(id)) return false;
    return this.accounts.every((e) => e.id !== id);
  }

  public exists(id: string) {
    if (invalidString(id)) return false;
    return this.accounts.some((e) => e.id === id);
  }

  public toObject(): AccountDto {
    return {
      id: this._id,
      given_name: this._given_name,
      family_name: this._family_name,
      email_address: this._email_address,
      balance: this._balance,
      note: this._note,
    };
  }

  save(): { error: boolean } {
    if (!this.valid) return { error: true };
    this.accounts.push(this.toObject());
    return { error: false };
  }
}

export default Account;
