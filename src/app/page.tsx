"use client";

import React, { useState, useEffect } from "react";
import { Portfolio, PensionAccount, EPFAccount, EPFData } from "@/lib/types";
import { ShieldCheck, Activity, Trash2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { migrateToPortfolio, mergeEPFData } from "@/lib/data-utils";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { EPFAccountView } from "@/components/EPFAccountView";
import dynamic from "next/dynamic";
import { v4 as uuidv4 } from "uuid";

const FileUpload = dynamic(
  () => import("@/components/FileUpload").then((mod) => mod.FileUpload),
  { ssr: false }
);

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);

  useEffect(() => {
    const savedPortfolio = localStorage.getItem("pensionTrackerPortfolio");
    if (savedPortfolio) {
      try {
        setPortfolio(JSON.parse(savedPortfolio));
      } catch (e) {
        console.error("Failed to parse saved portfolio");
      }
    } else {
      // Migrate legacy EPF Pulse data if it exists
      const legacyData = localStorage.getItem("epfPulseData");
      if (legacyData) {
        try {
          const parsedLegacy = JSON.parse(legacyData);
          const migrated = migrateToPortfolio(parsedLegacy);
          setPortfolio(migrated);
          localStorage.setItem("pensionTrackerPortfolio", JSON.stringify(migrated));
          // Clean up old legacy data
          localStorage.removeItem("epfPulseData");
        } catch (e) {}
      } else {
        // Initialize empty portfolio
        setPortfolio({ accounts: [] });
      }
    }
    setIsLoaded(true);
  }, []);

  const savePortfolio = (newPortfolio: Portfolio) => {
    setPortfolio(newPortfolio);
    localStorage.setItem("pensionTrackerPortfolio", JSON.stringify(newPortfolio));
  };

  const handleDataParsed = (data: EPFData) => {
    if (!portfolio) return;
    
    // Check if we already have an EPF account with this memberId/UAN
    const existingIndex = portfolio.accounts.findIndex(a => 
      a.type === 'EPF' && (a as EPFAccount).uan === data.uan
    );

    if (existingIndex >= 0) {
      // Merge with existing EPF account
      const existingAccount = portfolio.accounts[existingIndex] as EPFAccount;
      const mergedData = mergeEPFData(existingAccount, data);
      
      const newAccounts = [...portfolio.accounts];
      newAccounts[existingIndex] = {
        ...existingAccount,
        ...mergedData
      } as EPFAccount;
      
      savePortfolio({ accounts: newAccounts });
      setSelectedAccountId(existingAccount.id);
    } else {
      // Create new EPF account
      const newAccount: EPFAccount = {
        id: uuidv4(),
        type: 'EPF',
        name: data.establishmentName || 'My EPF Account',
        establishmentId: data.establishmentId,
        establishmentName: data.establishmentName,
        memberId: data.memberId,
        memberName: data.memberName,
        uan: data.uan,
        dob: data.dob,
        openingBalanceEE: data.openingBalanceEE,
        openingBalanceER: data.openingBalanceER,
        openingBalanceEPS: data.openingBalanceEPS,
        transactions: data.transactions,
      };
      
      savePortfolio({ accounts: [...portfolio.accounts, newAccount] });
      setSelectedAccountId(newAccount.id);
    }
    setShowAddAccount(false);
  };

  const handleAccountUpdated = (updatedAccount: PensionAccount) => {
    if (!portfolio) return;
    const newAccounts = portfolio.accounts.map(a => 
      a.id === updatedAccount.id ? updatedAccount : a
    );
    savePortfolio({ accounts: newAccounts });
  };

  const startFromScratch = () => {
    const newAccount: EPFAccount = {
      id: uuidv4(),
      type: 'EPF',
      name: 'Manual EPF Account',
      establishmentId: '',
      establishmentName: '',
      memberId: '',
      memberName: '',
      uan: '',
      dob: '',
      openingBalanceEE: 0,
      openingBalanceER: 0,
      openingBalanceEPS: 0,
      transactions: []
    };
    
    if (portfolio) {
      savePortfolio({ accounts: [...portfolio.accounts, newAccount] });
      setSelectedAccountId(newAccount.id);
      setShowAddAccount(false);
    }
  };

  const clearData = () => {
    if (confirm("Are you sure you want to clear all your saved data? This cannot be undone.")) {
      localStorage.removeItem("pensionTrackerPortfolio");
      setPortfolio({ accounts: [] });
      setSelectedAccountId(null);
    }
  };

  if (!isLoaded || !portfolio) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  const selectedAccount = portfolio.accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => { setSelectedAccountId(null); setShowAddAccount(false); }}
          >
            <div className="bg-slate-900 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">PensionTracker</h1>
          </div>
          <div className="flex items-center space-x-4">
            {selectedAccountId && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedAccountId(null)} className="hidden sm:flex text-slate-600">
                <Home className="w-4 h-4 mr-2" />
                Portfolio
              </Button>
            )}
            <div className="flex items-center text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              100% Private
            </div>
            {portfolio.accounts.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearData} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Data
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {showAddAccount || (portfolio.accounts.length === 0 && !selectedAccount) ? (
          <div className="max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Add a Pension Account</h2>
              <p className="text-slate-600 text-lg">
                Drag and drop your EPF Passbook PDF, or create an account manually.
              </p>
            </div>
            <FileUpload onDataParsed={handleDataParsed} />
            <div className="mt-8 text-center">
              <span className="text-sm text-slate-500 block mb-3">Or don't have a PDF?</span>
              <Button onClick={startFromScratch} variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                Start from scratch (Manual Entry)
              </Button>
            </div>
            {portfolio.accounts.length > 0 && (
              <div className="mt-8 text-center">
                <Button variant="ghost" onClick={() => setShowAddAccount(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ) : selectedAccount ? (
          selectedAccount.type === 'EPF' ? (
            <EPFAccountView 
              account={selectedAccount as EPFAccount} 
              onBack={() => setSelectedAccountId(null)} 
              onUpdate={handleAccountUpdated}
              onNewFileParsed={handleDataParsed}
            />
          ) : (
            <div className="text-center py-12">
              <p>Viewer for {selectedAccount.type} is under construction.</p>
              <Button className="mt-4" onClick={() => setSelectedAccountId(null)}>Back to Portfolio</Button>
            </div>
          )
        ) : (
          <PortfolioOverview 
            portfolio={portfolio} 
            onSelectAccount={setSelectedAccountId} 
            onAddAccount={() => setShowAddAccount(true)}
          />
        )}
      </main>
    </div>
  );
}
