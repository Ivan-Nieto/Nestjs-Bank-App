export class TransactionsDto {
  id: string;
  account_id: string;
  amount_money: {
    amount: 'number';
    currency: 'string';
  };
  note?: string;
  target_account_id?: string;
}
