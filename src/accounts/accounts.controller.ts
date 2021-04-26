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

  @Post()
  public addAccount(@Body() acc: AccountDto) {
    return this.accountService.createAccount(acc);
  }
}
