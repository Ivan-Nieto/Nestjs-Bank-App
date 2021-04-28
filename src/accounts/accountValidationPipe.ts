import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { invalidString } from '../utils/dataValidation';
import { ACCOUNTS } from './accounts';
import { AccountDto } from './account.dto';

import Account from './Account';
import { Transaction } from '../transactions/Transaction';

@Injectable()
export class AccountValidationPipe implements PipeTransform {
  private accounts: AccountDto[];

  constructor() {
    this.accounts = ACCOUNTS;
  }

  transform(value: any) {
    if (invalidString(value))
      throw new BadRequestException('Invalid account id');

    if (this.accounts.every((e) => e.id !== value))
      throw new BadRequestException(`Account ${value} not found`);

    return value;
  }
}

@Injectable()
export class CreateAccountValidationPipe implements PipeTransform {
  transform(value: any) {
    const Acc = new Account(value);
    const { valid, missingFields, invalidFields } = Acc.valid();

    if (missingFields?.length || invalidFields?.length) {
      const mf = missingFields?.length
        ? `Missing required field(s): ${missingFields?.join(', ')}`
        : '';

      const invF = invalidFields?.length
        ? `Invalid field(s): ${invalidFields?.join(', ')}`
        : '';

      throw new BadRequestException(
        missingFields?.length && invalidFields?.length
          ? `${mf} ${invF}`
          : mf + invF,
      );
    } else if (!valid)
      throw new BadRequestException('Missing account information');

    // Make sure id is unique
    if (!Acc.unique) throw new BadRequestException('Id already exists');

    return value;
  }
}

@Injectable()
export class DepositValidationPipe implements PipeTransform {
  transform(value: any) {
    const trans = new Transaction(value);

    // Send true to function so it ignores the missing account_id field
    const { valid, invalidFields, missingFields } = trans.valid(true);

    if (missingFields?.length || invalidFields?.length) {
      const mf = missingFields?.length
        ? `Missing required field(s): ${missingFields?.join(', ')}`
        : '';

      const invF = invalidFields?.length
        ? `Invalid field(s): ${invalidFields?.join(', ')}`
        : '';

      throw new BadRequestException(
        missingFields?.length && invalidFields?.length
          ? `${mf} ${invF}`
          : mf + invF,
      );
    } else if (!valid)
      throw new BadRequestException('Missing transaction information');

    // Make sure id is unique
    if (!trans.unique)
      throw new BadRequestException(
        'A transaction with this id already exists',
      );

    return value;
  }
}

@Injectable()
export class WithdrawValidationPipe implements PipeTransform {
  transform(value: any) {
    // Data validation
    const trans = new Transaction(value);
    // Send true to function so it ignores the missing account_id field
    const { valid, invalidFields, missingFields } = trans.valid(true);

    if (missingFields?.length || invalidFields?.length) {
      const mf = missingFields?.length
        ? `Missing required field(s): ${missingFields?.join(', ')}`
        : '';

      const invF = invalidFields?.length
        ? `Invalid field(s): ${invalidFields?.join(', ')}`
        : '';

      throw new BadRequestException(
        missingFields?.length && invalidFields?.length
          ? `${mf} ${invF}`
          : mf + invF,
      );
    } else if (!valid)
      throw new BadRequestException('Missing transaction information');

    // Make sure new transaction id is unique
    if (!trans.unique)
      throw new BadRequestException(
        'A transaction with this id already exists',
      );

    return value;
  }
}

@Injectable()
export class SendValidationPipe implements PipeTransform {
  private accounts: AccountDto[];

  constructor() {
    this.accounts = ACCOUNTS;
  }

  transform(value: any) {
    const trans = new Transaction(value);
    // Send true to function so it ignores the missing account_id field
    const { valid, invalidFields, missingFields } = trans.valid(true);

    if (missingFields?.length || invalidFields?.length) {
      const mf = missingFields?.length
        ? `Missing required field(s): ${missingFields?.join(', ')}`
        : '';

      const invF = invalidFields?.length
        ? `Invalid field(s): ${invalidFields?.join(', ')}`
        : '';

      throw new BadRequestException(
        missingFields?.length && invalidFields?.length
          ? `${mf} ${invF}`
          : mf + invF,
      );
    } else if (!valid)
      throw new BadRequestException('Missing transaction information');

    // Make sure transaction id is unique
    if (!trans.unique)
      throw new BadRequestException(
        'A transaction with this id already exists',
      );

    // Make sure target account exists
    const targetAccount = this.accounts.find(
      (e) => e.id === value.target_account_id,
    );
    if (!targetAccount)
      throw new BadRequestException('Target account not found');

    return value;
  }
}

export default AccountValidationPipe;
