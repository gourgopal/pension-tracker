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

  let useNewDataOB = false;
  if (existing.transactions.length > 0 && newData.transactions.length > 0) {
    const existingFirstTxn = [...existing.transactions].sort((a, b) => parseDate(a.date, a.wageMonth) - parseDate(b.date, b.wageMonth))[0];
    const newFirstTxn = [...newData.transactions].sort((a, b) => parseDate(a.date, a.wageMonth) - parseDate(b.date, b.wageMonth))[0];
    if (parseDate(newFirstTxn.date, newFirstTxn.wageMonth) < parseDate(existingFirstTxn.date, existingFirstTxn.wageMonth)) {
      useNewDataOB = true;
    }
  } else if (existing.transactions.length === 0) {
    useNewDataOB = true;
  }

  return {
    ...existing,
    memberId: existing.memberId || newData.memberId,
    memberName: existing.memberName || newData.memberName,
    establishmentId: existing.establishmentId || newData.establishmentId,
    establishmentName: existing.establishmentName || newData.establishmentName,
    uan: existing.uan || newData.uan,
    dob: existing.dob || newData.dob,
    openingBalanceEE: useNewDataOB ? newData.openingBalanceEE : existing.openingBalanceEE,
    openingBalanceER: useNewDataOB ? newData.openingBalanceER : existing.openingBalanceER,
    openingBalanceEPS: useNewDataOB ? newData.openingBalanceEPS : existing.openingBalanceEPS,
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

export interface ChartDataPoint {
  dateStr: string;
  timestamp: number;
  epfCorpus: number;
  npsCorpus: number;
  ppfCorpus: number;
  totalCorpus: number;
}

export const getPortfolioChartData = (portfolio: Portfolio): ChartDataPoint[] => {
  const dataPoints: Map<number, ChartDataPoint> = new Map();

  let currentEPF = 0;
  let currentNPS = 0;
  let currentPPF = 0;

  // Add all opening balances as the first data point (assume Jan 1st 2000 for simplicity of "start")
  let hasAccounts = false;
  portfolio.accounts.forEach(acc => {
    if (acc.type === 'EPF') {
      currentEPF += acc.openingBalanceEE + acc.openingBalanceER;
      hasAccounts = true;
    } else if (acc.type === 'NPS') {
      currentNPS += acc.openingBalanceTier1 + acc.openingBalanceTier2;
      hasAccounts = true;
    } else if (acc.type === 'PPF') {
      currentPPF += acc.openingBalance;
      hasAccounts = true;
    }
  });

  if (hasAccounts) {
    dataPoints.set(0, {
      dateStr: 'Opening Balance',
      timestamp: 0,
      epfCorpus: currentEPF,
      npsCorpus: currentNPS,
      ppfCorpus: currentPPF,
      totalCorpus: currentEPF + currentNPS + currentPPF
    });
  }

  // Extract all transactions from all accounts with their parsed timestamps
  const allTxns: { timestamp: number; dateStr: string; type: string; amount: number }[] = [];

  portfolio.accounts.forEach(acc => {
    if (acc.type === 'EPF') {
      acc.transactions.forEach(t => {
        let ts = 0;
        let dStr = t.date;
        if (t.date === 'Year End' && t.wageMonth === 'Annual') {
           // For interest, pretend it's March 31 of the relevant year. 
           // If we don't know the year, we can just use a large timestamp, but it's better to sort correctly.
           ts = new Date(2100, 0, 1).getTime(); // fallback
        } else {
          const parts = t.date.split('-');
          if (parts.length === 3) {
            ts = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
          }
        }
        allTxns.push({ timestamp: ts, dateStr: dStr, type: 'EPF', amount: t.eeShare + t.erShare });
      });
    } else if (acc.type === 'NPS') {
       acc.transactions.forEach(t => {
          const parts = t.date.split('-');
          let ts = parts.length === 3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime() : 0;
          allTxns.push({ timestamp: ts, dateStr: t.date, type: 'NPS', amount: t.tier1Employee + t.tier1Employer + t.tier2 });
       });
    } else if (acc.type === 'PPF') {
       acc.transactions.forEach(t => {
          const parts = t.date.split('-');
          let ts = parts.length === 3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime() : 0;
          allTxns.push({ timestamp: ts, dateStr: t.date, type: 'PPF', amount: t.deposit + t.interest });
       });
    }
  });

  allTxns.sort((a, b) => a.timestamp - b.timestamp);

  // Replay transactions to build cumulative sum over time
  allTxns.forEach(t => {
    if (t.timestamp === 0) return; // skip invalid dates

    if (t.type === 'EPF') currentEPF += t.amount;
    if (t.type === 'NPS') currentNPS += t.amount;
    if (t.type === 'PPF') currentPPF += t.amount;

    dataPoints.set(t.timestamp, {
      dateStr: t.dateStr,
      timestamp: t.timestamp,
      epfCorpus: currentEPF,
      npsCorpus: currentNPS,
      ppfCorpus: currentPPF,
      totalCorpus: currentEPF + currentNPS + currentPPF
    });
  });

  // Convert map to sorted array
  const result = Array.from(dataPoints.values()).sort((a, b) => a.timestamp - b.timestamp);
  
  // Format dates for display
  return result.map(dp => {
    if (dp.timestamp === 0) return dp;
    if (dp.timestamp > new Date(2050, 0, 1).getTime()) return { ...dp, dateStr: 'Year End' }; // our fallback for interest
    const d = new Date(dp.timestamp);
    return { ...dp, dateStr: `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}` };
  });
};

export const calculateProjectedInterest = (account: EPFAccount, interestRate: number = 8.25): { amount: number; months: number; isOutdated: boolean } => {
  const currentCorpus = getAccountCorpus(account);
  if (currentCorpus === 0 || account.transactions.length === 0) return { amount: 0, months: 0, isOutdated: false };
  
  // Find the last transaction date
  let lastTxnDate = new Date(2000, 0, 1);
  account.transactions.forEach(t => {
    if (t.date !== 'Year End') {
      const parts = t.date.split('-');
      if (parts.length === 3) {
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (d > lastTxnDate) lastTxnDate = d;
      }
    }
  });

  const now = new Date();
  
  // Calculate difference in months between lastTxnDate and now
  let monthsDiff = (now.getFullYear() - lastTxnDate.getFullYear()) * 12 + (now.getMonth() - lastTxnDate.getMonth());
  if (monthsDiff < 0) monthsDiff = 0;
  
  // Is passbook outdated? (Hasn't been updated in over 1 month)
  const isOutdated = monthsDiff > 1;
  
  // Project interest based on current corpus
  const projectedInterest = currentCorpus * (interestRate / 100) * (monthsDiff / 12);
  
  return {
    amount: Math.round(projectedInterest),
    months: monthsDiff,
    isOutdated
  };
};
