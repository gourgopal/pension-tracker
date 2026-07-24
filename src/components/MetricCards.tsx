"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EPFData } from "@/lib/types";
import { Wallet, Landmark, TrendingUp, PiggyBank, ShieldCheck } from "lucide-react";

interface MetricCardsProps {
  data: EPFData;
}

export function MetricCards({ data }: MetricCardsProps) {
  // Compute totals
  const totalEE = data.openingBalanceEE + data.transactions.reduce((acc, curr) => acc + curr.eeShare, 0);
  const totalER = data.openingBalanceER + data.transactions.reduce((acc, curr) => acc + curr.erShare, 0);
  const totalEPS = data.openingBalanceEPS + data.transactions.reduce((acc, curr) => acc + curr.epsShare, 0);
  const totalInterest = data.transactions.filter(t => t.isInterest).reduce((acc, curr) => acc + curr.eeShare + curr.erShare, 0);
  const totalCorpus = totalEE + totalER;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Grand Total Corpus</CardTitle>
          <Wallet className="w-4 h-4 opacity-75" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCorpus)}</div>
          <p className="text-xs opacity-75 mt-1">Excludes EPS pension</p>
        </CardContent>
      </Card>
      
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Employee Share</CardTitle>
          <PiggyBank className="w-4 h-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalEE)}</div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Employer Share</CardTitle>
          <Landmark className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalER)}</div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Interest Earned</CardTitle>
          <TrendingUp className="w-4 h-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalInterest)}</div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Total EPS</CardTitle>
          <ShieldCheck className="w-4 h-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalEPS)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
