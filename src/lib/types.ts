export interface Transaction {
  date: string;
  wageMonth: string;
  particulars: string;
  epfWage: number;
  epsWage: number;
  eeShare: number;
  erShare: number;
  epsShare: number;
  isInterest: boolean;
}

export interface EPFData {
  establishmentId: string;
  establishmentName: string;
  memberId: string;
  memberName: string;
  uan: string;
  dob: string;
  openingBalanceEE: number;
  openingBalanceER: number;
  openingBalanceEPS: number;
  transactions: Transaction[];
}

export interface AccountSummary {
  totalEE: number;
  totalER: number;
  totalEPS: number;
  totalInterest: number;
  grandTotal: number;
}
