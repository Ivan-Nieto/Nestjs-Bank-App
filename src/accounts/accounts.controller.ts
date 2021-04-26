import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountDto } from './account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private accountService: AccountsService) {}

  @Get()
  public getAccounts() {
    return this.accountService.getAccounts();
  }

  @Get(':id')
  public getAccount(@Param('id') id: string) {
    return this.accountService.getAccount(id);
  }

  @Get(':id/transactions')
  public getTransactions(@Param('id') id: string) {
    return this.accountService.getAccountTransactions(id);
  }

  @Post()
  public addAccount(@Body() acc: AccountDto) {
    return this.accountService.createAccount(acc);
  }

  @Post(':id/transactions/add')
  public addFunds(@Param('id') id: string, @Body() trz: any) {
    return this.accountService.deposit(id, trz);
  }

  @Post(':id/transactions/withdraw')
  public withdrawFunds(@Param('id') id: string, @Body() trz: any) {
    return this.accountService.withdraw(id, trz);
  }

  @Post(':id/transactions/send')
  public sendFunds(@Param('id') id: string, @Body() trz: any) {
    return this.accountService.send(id, trz);
  }
}
