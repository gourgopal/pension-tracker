export type AccountType = 'EPF' | 'NPS' | 'PPF' | 'OTHER';

export interface BaseAccount {
  id: string; // Unique UUID
  type: AccountType;
  name: string; // e.g., "Valocity EPF", "HDFC NPS"
}

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

export interface EPFAccount extends BaseAccount {
  type: 'EPF';
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

export interface NPSTransaction {
  date: string;
  particulars: string;
  tier1Employee: number;
  tier1Employer: number;
  tier2: number;
}

export interface NPSAccount extends BaseAccount {
  type: 'NPS';
  pran: string;
  subscriberName: string;
  openingBalanceTier1: number;
  openingBalanceTier2: number;
  transactions: NPSTransaction[];
}

export interface PPFTransaction {
  date: string;
  particulars: string;
  deposit: number;
  interest: number;
}

export interface PPFAccount extends BaseAccount {
  type: 'PPF';
  accountNumber: string;
  openingBalance: number;
  transactions: PPFTransaction[];
}

export type PensionAccount = EPFAccount | NPSAccount | PPFAccount;

export interface Portfolio {
  accounts: PensionAccount[];
}

// Kept for backward compatibility parsing temporarily
export interface EPFData extends Omit<EPFAccount, 'id' | 'type' | 'name'> {}
