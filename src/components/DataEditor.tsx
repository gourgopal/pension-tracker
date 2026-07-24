"use client";

import React, { useState, useEffect } from "react";
import { EPFData, Transaction } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Save } from "lucide-react";

interface DataEditorProps {
  data: EPFData | null;
  onUpdate: (data: EPFData) => void;
}

export function DataEditor({ data, onUpdate }: DataEditorProps) {
  if (!data) return null;

  const [localData, setLocalData] = useState<EPFData>({ ...data });

  useEffect(() => {
    setLocalData({ ...data });
  }, [data]);

  const handleOBChange = (field: keyof EPFData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalData({ ...localData, [field]: numValue });
  };

  const handleTxnChange = (index: number, field: keyof Transaction, value: string) => {
    const updatedTxns = [...localData.transactions];
    if (field === 'wageMonth' || field === 'date' || field === 'particulars') {
      (updatedTxns[index] as any)[field] = value;
    } else {
      (updatedTxns[index] as any)[field] = parseFloat(value) || 0;
    }
    setLocalData({ ...localData, transactions: updatedTxns });
  };

  const handleAddTxn = () => {
    const newTxn: Transaction = {
      wageMonth: "Apr-2024",
      date: "15-05-2024",
      particulars: "Cont. For Due-Month",
      epfWage: 0,
      epsWage: 0,
      eeShare: 0,
      erShare: 0,
      epsShare: 0,
      isInterest: false
    };
    setLocalData({ ...localData, transactions: [...localData.transactions, newTxn] });
  };

  const handleDeleteTxn = (index: number) => {
    const updatedTxns = localData.transactions.filter((_, i) => i !== index);
    setLocalData({ ...localData, transactions: updatedTxns });
  };

  const saveChanges = () => {
    onUpdate(localData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manual Data Editor</h2>
          <p className="text-sm text-slate-500">Edit values manually if parsing missed anything.</p>
        </div>
        <Button onClick={saveChanges} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
          Opening Balances (Initial Corpus)
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Employee (EE) Balance</label>
            <input 
              type="number" 
              value={localData.openingBalanceEE || ''} 
              onChange={(e) => handleOBChange('openingBalanceEE', e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Employer (ER) Balance</label>
            <input 
              type="number" 
              value={localData.openingBalanceER || ''} 
              onChange={(e) => handleOBChange('openingBalanceER', e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Pension (EPS) Balance</label>
            <input 
              type="number" 
              value={localData.openingBalanceEPS || ''} 
              onChange={(e) => handleOBChange('openingBalanceEPS', e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-semibold text-slate-700">Transactions</span>
          <Button onClick={handleAddTxn} variant="outline" size="sm" className="h-8">
            <Plus className="w-4 h-4 mr-1" /> Add Row
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Wage Month</th>
                <th className="px-4 py-3 w-48">Particulars</th>
                <th className="px-4 py-3 text-right">EPF Wage</th>
                <th className="px-4 py-3 text-right">EE Share</th>
                <th className="px-4 py-3 text-right">ER Share</th>
                <th className="px-4 py-3 text-right">EPS Share</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localData.transactions.map((txn, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      value={txn.date} 
                      onChange={(e) => handleTxnChange(index, 'date', e.target.value)}
                      className="w-24 border border-slate-200 rounded px-2 py-1 text-xs"
                      placeholder="DD-MM-YYYY"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      value={txn.wageMonth} 
                      onChange={(e) => handleTxnChange(index, 'wageMonth', e.target.value)}
                      className="w-20 border border-slate-200 rounded px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      value={txn.particulars} 
                      onChange={(e) => handleTxnChange(index, 'particulars', e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="number" 
                      value={txn.epfWage || ''} 
                      onChange={(e) => handleTxnChange(index, 'epfWage', e.target.value)}
                      className="w-20 border border-slate-200 rounded px-2 py-1 text-xs text-right ml-auto block"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="number" 
                      value={txn.eeShare || ''} 
                      onChange={(e) => handleTxnChange(index, 'eeShare', e.target.value)}
                      className="w-20 border border-slate-200 rounded px-2 py-1 text-xs text-right ml-auto block"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="number" 
                      value={txn.erShare || ''} 
                      onChange={(e) => handleTxnChange(index, 'erShare', e.target.value)}
                      className="w-20 border border-slate-200 rounded px-2 py-1 text-xs text-right ml-auto block"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="number" 
                      value={txn.epsShare || ''} 
                      onChange={(e) => handleTxnChange(index, 'epsShare', e.target.value)}
                      className="w-20 border border-slate-200 rounded px-2 py-1 text-xs text-right ml-auto block"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button 
                      onClick={() => handleDeleteTxn(index)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 inline-block"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {localData.transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No transactions yet. Click "Add Row" to start adding manual data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
