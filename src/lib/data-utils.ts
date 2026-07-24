import { EPFData, EPFAccount, Portfolio, PensionAccount } from "./types";
import { v4 as uuidv4 } from "uuid";

export const mergeEPFData = (existing: EPFData, newData: EPFData): EPFData => {
  if (!existing || (existing.transactions.length === 0 && existing.openingBalanceEE === 0)) return newData;
  if (!newData || (newData.transactions.length === 0 && newData.openingBalanceEE === 0)) return existing;

  const allTxns = [...existing.transactions, ...newData.transactions];
  
  const uniqueTxnsMap = new Map();
  allTxns.forEach(t => {
    const key = `${t.date}-${t.wageMonth}-${t.particulars}-${t.eeShare}`;
    uniqueTxnsMap.set(key, t);
  });
  
  const uniqueTxns = Array.from(uniqueTxnsMap.values());

  const parseDate = (d: string, wm: string) => {
    if (d === 'Year End') {
      return new Date(2100, 0, 1).getTime();
    }
    const parts = d.split('-');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
    }
    return 0;
  };

  uniqueTxns.sort((a, b) => parseDate(a.date, a.wageMonth) - parseDate(b.date, b.wageMonth));

  return {
    ...existing,
    memberId: existing.memberId || newData.memberId,
    memberName: existing.memberName || newData.memberName,
    establishmentId: existing.establishmentId || newData.establishmentId,
    establishmentName: existing.establishmentName || newData.establishmentName,
    uan: existing.uan || newData.uan,
    dob: existing.dob || newData.dob,
    transactions: uniqueTxns
  };
};

export const migrateToPortfolio = (epfData: EPFData | null): Portfolio => {
  if (!epfData) return { accounts: [] };
  
  const migratedAccount: EPFAccount = {
    id: uuidv4(),
    type: 'EPF',
    name: epfData.establishmentName || 'My EPF Account',
    establishmentId: epfData.establishmentId,
    establishmentName: epfData.establishmentName,
    memberId: epfData.memberId,
    memberName: epfData.memberName,
    uan: epfData.uan,
    dob: epfData.dob,
    openingBalanceEE: epfData.openingBalanceEE,
    openingBalanceER: epfData.openingBalanceER,
    openingBalanceEPS: epfData.openingBalanceEPS,
    transactions: epfData.transactions,
  };

  return {
    accounts: [migratedAccount]
  };
};

export const getAccountCorpus = (account: PensionAccount): number => {
  if (account.type === 'EPF') {
    return account.openingBalanceEE + account.openingBalanceER + 
           account.transactions.reduce((acc, t) => acc + t.eeShare + t.erShare, 0);
  }
  if (account.type === 'NPS') {
    return account.openingBalanceTier1 + account.openingBalanceTier2 +
           account.transactions.reduce((acc, t) => acc + t.tier1Employee + t.tier1Employer + t.tier2, 0);
  }
  if (account.type === 'PPF') {
    return account.openingBalance + account.transactions.reduce((acc, t) => acc + t.deposit + t.interest, 0);
  }
  return 0;
};

export const getPortfolioTotal = (portfolio: Portfolio): number => {
  return portfolio.accounts.reduce((acc, account) => acc + getAccountCorpus(account), 0);
};
