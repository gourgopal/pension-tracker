"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MetricCards } from "@/components/MetricCards";
import { BreakdownPie } from "@/components/Charts/BreakdownPie";
import { ContributionBar } from "@/components/Charts/ContributionBar";
import { ProjectionCalculator } from "@/components/ProjectionCalculator";
import { EPFData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Trash2, ShieldCheck, Activity, Plus } from "lucide-react";
import { mergeEPFData } from "@/lib/data-utils";

const FileUpload = dynamic(
  () => import("@/components/FileUpload").then((mod) => mod.FileUpload),
  { ssr: false }
);

const DataEditor = dynamic(
  () => import("@/components/DataEditor").then((mod) => mod.DataEditor),
  { ssr: false }
);

export default function Dashboard() {
  const [epfData, setEpfData] = useState<EPFData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from local storage
    const saved = localStorage.getItem("epfPulseData");
    if (saved) {
      try {
        setEpfData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved data");
      }
    }
    setIsLoaded(true);
  }, []);

  const handleDataParsed = (data: EPFData) => {
    const newData = epfData ? mergeEPFData(epfData, data) : data;
    setEpfData(newData);
    localStorage.setItem("epfPulseData", JSON.stringify(newData));
  };

  const handleDataUpdated = (data: EPFData) => {
    setEpfData(data);
    localStorage.setItem("epfPulseData", JSON.stringify(data));
  };

  const startFromScratch = () => {
    const emptyData: EPFData = {
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
    handleDataUpdated(emptyData);
  };

  const clearData = () => {
    if (confirm("Are you sure you want to clear all your saved data? This cannot be undone.")) {
      localStorage.removeItem("epfPulseData");
      setEpfData(null);
    }
  };

  const exportCSV = () => {
    if (!epfData) return;
    
    const headers = ["Date", "Wage Month", "Particulars", "EPF Wage", "EPS Wage", "EE Share", "ER Share", "EPS Share"];
    const rows = epfData.transactions.map(t => 
      [t.date, t.wageMonth, `"${t.particulars}"`, t.epfWage, t.epsWage, t.eeShare, t.erShare, t.epsShare].join(",")
    );
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "epf_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  // Calculate some aggregate values for the projection calculator
  let currentCorpus = 0;
  let latestMonthlyContribution = 0;

  if (epfData) {
    currentCorpus = epfData.openingBalanceEE + epfData.openingBalanceER + 
                    epfData.transactions.reduce((acc, t) => acc + t.eeShare + t.erShare, 0);
    
    // Find latest regular contribution (not interest)
    const regularTxns = epfData.transactions.filter(t => !t.isInterest);
    if (regularTxns.length > 0) {
      const lastTxn = regularTxns[regularTxns.length - 1];
      latestMonthlyContribution = lastTxn.eeShare + lastTxn.erShare;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">EPF Pulse</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              100% Client Side
            </div>
            {epfData && (
              <Button variant="ghost" size="sm" onClick={clearData} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Data
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!epfData ? (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Analyze your EPF Passbook</h2>
              <p className="text-slate-600 text-lg">
                Visualize your contributions, track interest growth, and project your retirement corpus securely. Your data never leaves your browser.
              </p>
            </div>
            <FileUpload onDataParsed={handleDataParsed} />
            <div className="mt-8 text-center">
              <span className="text-sm text-slate-500 block mb-3">Or don't have a PDF?</span>
              <Button onClick={startFromScratch} variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                Start from scratch (Manual Entry)
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Welcome back, {epfData.memberName || "Member"}
                </h2>
                <p className="text-sm text-slate-500">
                  UAN: {epfData.uan || "N/A"} | Establishment: {epfData.establishmentName || "N/A"}
                </p>
              </div>
              <Button onClick={exportCSV} variant="outline" className="bg-white">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <MetricCards data={epfData} />

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
                      <BreakdownPie data={epfData} />
                    </CardContent>
                  </Card>
                  
                  <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Contribution History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ContributionBar data={epfData} />
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
                    <FileUpload onDataParsed={handleDataParsed} compact={true} />
                  </div>
                </div>
                <DataEditor data={epfData} onUpdate={handleDataUpdated} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
