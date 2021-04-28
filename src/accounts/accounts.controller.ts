import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountDto } from './account.dto';
import { TransactionsDto } from '../transactions/transactions.dto';
import {
  AccountValidationPipe,
  CreateAccountValidationPipe,
  DepositValidationPipe,
  WithdrawValidationPipe,
} from './accountValidationPipe';

@Controller('accounts')
export class AccountsController {
  constructor(private accountService: AccountsService) {}

  @Get()
  public getAccounts() {
    return this.accountService.getAccounts();
  }

  @Get(':id')
  public getAccount(@Param('id', AccountValidationPipe) id: string) {
    return this.accountService.getAccount(id);
  }

  @Get(':id/transactions')
  public getTransactions(@Param('id', AccountValidationPipe) id: string) {
    return this.accountService.getAccountTransactions(id);
  }

  @Post()
  public addAccount(@Body(CreateAccountValidationPipe) acc: AccountDto) {
    return this.accountService.createAccount(acc);
  }

  @Post(':id/transactions/add')
  public addFunds(
    @Param('id', AccountValidationPipe) id: string,
    @Body(DepositValidationPipe) trz: TransactionsDto,
  ) {
    return this.accountService.deposit(id, trz);
  }

  @Post(':id/transactions/withdraw')
  public withdrawFunds(
    @Param('id', AccountValidationPipe) id: string,
    @Body(WithdrawValidationPipe) trz: TransactionsDto,
  ) {
    return this.accountService.withdraw(id, trz);
  }

  @Post(':id/transactions/send')
  public sendFunds(
    @Param('id', AccountValidationPipe) id: string,
    @Body() trz: TransactionsDto,
  ) {
    return this.accountService.send(id, trz);
  }
}
