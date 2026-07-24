"use client";

import React, { useState } from "react";
import { MetricCards } from "./MetricCards";
import { BreakdownPie } from "./Charts/BreakdownPie";
import { ContributionBar } from "./Charts/ContributionBar";
import { ProjectionCalculator } from "./ProjectionCalculator";
import { DataEditor } from "./DataEditor";
import { EPFAccount } from "@/lib/types";
import { calculateProjectedInterest } from "@/lib/data-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, ArrowLeft, Lightbulb, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";

const FileUpload = dynamic(
  () => import("./FileUpload").then((mod) => mod.FileUpload),
  { ssr: false }
);

interface EPFAccountViewProps {
  account: EPFAccount;
  onBack: () => void;
  onUpdate: (data: EPFAccount) => void;
  onNewFileParsed: (data: any) => void;
}

export function EPFAccountView({ account, onBack, onUpdate, onNewFileParsed }: EPFAccountViewProps) {
  let currentCorpus = account.openingBalanceEE + account.openingBalanceER + 
                      account.transactions.reduce((acc, t) => acc + t.eeShare + t.erShare, 0);
  
  let latestMonthlyContribution = 0;
  const regularTxns = account.transactions.filter(t => !t.isInterest);
  if (regularTxns.length > 0) {
    const lastTxn = regularTxns[regularTxns.length - 1];
    latestMonthlyContribution = lastTxn.eeShare + lastTxn.erShare;
  }
  
  const projectedInterest = calculateProjectedInterest(account);
  
  const addProjectedInterest = () => {
    const d = new Date();
    const newTxn = {
      date: 'Year End',
      wageMonth: 'Annual',
      particulars: 'Projected Interest (Est)',
      epfWage: 0,
      epsWage: 0,
      eeShare: projectedInterest.amount,
      erShare: 0, // Simplified to add all to EE for projection purposes
      epsShare: 0,
      isInterest: true
    };
    onUpdate({ ...account, transactions: [...account.transactions, newTxn] });
  };

  const exportCSV = () => {
    const headers = ["Date", "Wage Month", "Particulars", "EPF Wage", "EPS Wage", "EE Share", "ER Share", "EPS Share"];
    const rows = account.transactions.map(t => 
      [t.date, t.wageMonth, `"${t.particulars}"`, t.epfWage, t.epsWage, t.eeShare, t.erShare, t.epsShare].join(",")
    );
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `epf_transactions_${account.uan}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 mb-4">
        <Button variant="ghost" onClick={onBack} className="text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portfolio
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {account.name}
          </h2>
          <p className="text-sm text-slate-500">
            UAN: {account.uan || "N/A"} | Member: {account.memberName || "N/A"}
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="bg-white">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
      
      {projectedInterest.isOutdated && (
        <Card className="bg-amber-50 border-amber-200 shadow-sm animate-in fade-in">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full mt-0.5">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">Your passbook is {projectedInterest.months} months outdated.</h4>
                <p className="text-sm text-amber-700 mt-1">Based on an 8.25% rate, you have approximately <strong>₹{projectedInterest.amount.toLocaleString('en-IN')}</strong> in pending interest to be credited.</p>
              </div>
            </div>
            <Button onClick={addProjectedInterest} className="bg-amber-500 hover:bg-amber-600 text-white shrink-0 shadow-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Add Projected Interest
            </Button>
          </CardContent>
        </Card>
      )}

      <MetricCards data={account} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projection">Retirement Projection</TabsTrigger>
          <TabsTrigger value="data-editor">Data Editor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1 shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Corpus Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <BreakdownPie data={account} />
              </CardContent>
            </Card>
            
            <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Contribution History</CardTitle>
              </CardHeader>
              <CardContent>
                <ContributionBar data={account} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="projection" className="mt-6">
          <ProjectionCalculator 
            currentCorpus={currentCorpus} 
            monthlyContribution={latestMonthlyContribution} 
          />
        </TabsContent>
        
        <TabsContent value="data-editor" className="mt-6">
          <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Have more passbooks?</h3>
              <p className="text-sm text-blue-700 mt-1">Upload another PDF for a different year to consolidate your timeline.</p>
            </div>
            <div className="w-64">
              <FileUpload onDataParsed={onNewFileParsed} compact={true} />
            </div>
          </div>
          <DataEditor data={account} onUpdate={onUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
