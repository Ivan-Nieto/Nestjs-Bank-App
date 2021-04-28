import { TransactionsDto } from './transactions.dto';
import { TRANSACTIONS } from './transactions';
import {
  notObject,
  invalidString,
  invalidNumber,
} from '../utils/dataValidation';

export class Transaction {
  private transactions: TransactionsDto[] = TRANSACTIONS;

  private _initialized = false;
  private _isValid = false;
  private _unique = false;

  private _id: string;
  private _amount_money: { amount: number; currency: string };
  private _account_id: string;
  private _note: string;
  private _target_account_id: string;

  constructor(trz?: Partial<TransactionsDto>) {
    if (!trz) return;

    this._id = trz.id;
    this._amount_money = trz.amount_money;
    this._account_id = trz.account_id;
    this._note = trz.note;
    this._target_account_id = trz.target_account_id;

    this._isValid = this.valid().valid;
    this._unique = this.isUnique(this._id);
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

  get amount_money(): { amount: number; currency: string } | undefined {
    return this._amount_money;
  }

  get account_id(): string | undefined {
    return this._account_id;
  }

  get note(): string | undefined {
    return this._note;
  }

  get target_account_id(): string | undefined {
    return this._target_account_id;
  }

  valid(
    ignoreAccountId?: boolean,
  ): {
    valid: boolean;
    missingFields?: string[];
    invalidFields?: string[];
  } {
    const invalidFields = [];
    const missingFields = [];

    // amount_money
    if (this._amount_money == null) missingFields.push('amount_money');
    else if (notObject(this._amount_money)) invalidFields.push('amount_money');

    // account_id
    if (!ignoreAccountId && this._account_id == null)
      missingFields.push('account_id');
    else if (!ignoreAccountId && invalidString(this._account_id))
      invalidFields.push('account_id');

    // amount_money.amount
    if (this._amount_money?.amount == null) missingFields.push('amount');
    else if (invalidNumber(this._amount_money?.amount))
      invalidFields.push('amount');

    // amount_money.currency
    if (this._amount_money?.currency == null) missingFields.push('currency');
    else if (invalidString(this._amount_money?.currency))
      invalidFields.push('currency');

    // Optional fields
    if (Boolean(this._note) && invalidString(this._note))
      invalidFields.push('note');
    if (
      Boolean(this._target_account_id) &&
      invalidString(this._target_account_id)
    )
      invalidFields.push('target_account_id');

    return {
      valid: !Boolean(invalidFields.length || missingFields.length),
      missingFields,
      invalidFields,
    };
  }

  isUnique(id: string) {
    if (invalidString(id)) return false;
    return this.transactions.every((e) => e.id !== id);
  }

  toObject(): TransactionsDto {
    return {
      id: this._id,
      account_id: this._account_id,
      amount_money: this._amount_money,
      ...(Boolean(this._note) ? { note: this._note } : {}),
      ...(Boolean(this._target_account_id)
        ? { target_account_id: this._target_account_id }
        : {}),
    };
  }

  save(): { error: boolean } {
    if (!this.valid) return { error: true };
    this.transactions.push(this.toObject());
    return { error: false };
  }
}
