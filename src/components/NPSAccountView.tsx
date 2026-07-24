"use client";

import React, { useState } from "react";
import { NPSAccount, PensionAccount, Transaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Plus, Trash2, PiggyBank } from "lucide-react";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";

interface NPSAccountViewProps {
  account: NPSAccount;
  onBack: () => void;
  onUpdate: (account: PensionAccount) => void;
}

export function NPSAccountView({ account, onBack, onUpdate }: NPSAccountViewProps) {
  const [editedAccount, setEditedAccount] = useState<NPSAccount>({ ...account });
  const [isEditing, setIsEditing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSave = () => {
    onUpdate(editedAccount);
    setIsEditing(false);
  };

  const totalCorpus = (editedAccount.openingBalanceTier1 || 0) + (editedAccount.openingBalanceTier2 || 0) + 
    (editedAccount.transactions || []).reduce((acc, t) => acc + (t.tier1Employee || 0) + (t.tier1Employer || 0) + (t.tier2 || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portfolio
        </Button>
        {isEditing ? (
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="text-slate-700">
            Edit Details
          </Button>
        )}
      </div>

      <Card className="bg-emerald-900 text-white border-none shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"></div>
        <CardHeader className="relative z-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <PiggyBank className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">{editedAccount.name}</CardTitle>
              <p className="text-emerald-300 text-sm mt-1">{editedAccount.pran ? `PRAN: ${editedAccount.pran}` : "NPS Account"}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-5xl font-bold tracking-tight mt-4">
            {formatCurrency(totalCorpus)}
          </div>
          <p className="text-emerald-300 mt-2 text-sm">Total NPS Corpus</p>
        </CardContent>
      </Card>

      {isEditing ? (
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Edit Balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tier 1 Balance</label>
                <Input 
                  type="number" 
                  value={editedAccount.openingBalanceTier1 || ''} 
                  onChange={(e) => setEditedAccount({...editedAccount, openingBalanceTier1: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tier 2 Balance</label>
                <Input 
                  type="number" 
                  value={editedAccount.openingBalanceTier2 || ''} 
                  onChange={(e) => setEditedAccount({...editedAccount, openingBalanceTier2: Number(e.target.value)})}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wider">Tier 1 Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(editedAccount.openingBalanceTier1 || 0)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wider">Tier 2 Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(editedAccount.openingBalanceTier2 || 0)}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
