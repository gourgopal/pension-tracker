"use client";

import React from "react";
import { Portfolio, PensionAccount } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, PiggyBank, Briefcase, TrendingUp, Trash2 } from "lucide-react";
import { getPortfolioTotal, getAccountCorpus, getPortfolioChartData } from "@/lib/data-utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PortfolioOverviewProps {
  portfolio: Portfolio;
  onSelectAccount: (accountId: string) => void;
  onAddAccount: () => void;
  onDeleteAccount?: (accountId: string) => void;
}

export function PortfolioOverview({ portfolio, onSelectAccount, onAddAccount, onDeleteAccount }: PortfolioOverviewProps) {
  const grandTotal = getPortfolioTotal(portfolio);
  const chartData = getPortfolioChartData(portfolio);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'EPF': return <Briefcase className="w-6 h-6 text-blue-500" />;
      case 'NPS': return <PiggyBank className="w-6 h-6 text-emerald-500" />;
      case 'PPF': return <Wallet className="w-6 h-6 text-amber-500" />;
      default: return <Wallet className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Your Pension Portfolio</h2>
          <p className="text-slate-500 mt-1">Manage and track all your retirement assets in one place.</p>
        </div>
        <Button onClick={onAddAccount} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/3 -translate-x-1/3"></div>
        
        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="text-lg font-medium text-slate-300">Total Retirement Corpus</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-5xl font-bold tracking-tight">{formatCurrency(grandTotal)}</div>
          <p className="text-slate-400 mt-2 text-sm">Aggregated across {portfolio.accounts.length} account{portfolio.accounts.length !== 1 ? 's' : ''}</p>
          
          {chartData.length > 1 && (
            <div className="h-48 mt-8 -mx-6 -mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalCorpus" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Your Accounts</h3>
        {portfolio.accounts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No accounts added yet.</p>
            <p className="text-sm text-slate-400 mb-4">Add your EPF, NPS, or PPF accounts to get started.</p>
            <Button onClick={onAddAccount} variant="outline" className="bg-white">
              <Plus className="w-4 h-4 mr-2" />
              Add First Account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.accounts.map((account) => (
              <Card 
                key={account.id} 
                className="group cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white"
                onClick={() => onSelectAccount(account.id)}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      {account.type}
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1">
                      {account.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {onDeleteAccount && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAccount(account.id);
                        }}
                        className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                      {getAccountIcon(account.type)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 mt-2">
                    {formatCurrency(getAccountCorpus(account))}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Current Balance</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
