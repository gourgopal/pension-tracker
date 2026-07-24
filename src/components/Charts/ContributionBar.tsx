"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { EPFData } from "@/lib/types";

interface ContributionBarProps {
  data: EPFData;
}

export function ContributionBar({ data }: ContributionBarProps) {
  // Group by year for a cleaner chart (or month if not many)
  const groupedData: Record<string, { year: string; ee: number; er: number; eps: number }> = {};

  data.transactions.forEach(t => {
    if (t.isInterest) return; // Only count monthly contributions
    
    // wageMonth is usually "MMM-YYYY" e.g., "APR-2023"
    const parts = t.wageMonth.split('-');
    const year = parts.length === 2 ? parts[1] : 'Unknown';
    
    if (!groupedData[year]) {
      groupedData[year] = { year, ee: 0, er: 0, eps: 0 };
    }
    groupedData[year].ee += t.eeShare;
    groupedData[year].er += t.erShare;
    groupedData[year].eps += t.epsShare;
  });

  const chartData = Object.values(groupedData).sort((a, b) => parseInt(a.year) - parseInt(b.year));

  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="year" axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(val) => `₹${val / 1000}k`} axisLine={false} tickLine={false} />
          <Tooltip formatter={formatCurrency} cursor={{ fill: '#f8fafc' }} />
          <Legend />
          <Bar dataKey="ee" name="Employee" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
          <Bar dataKey="er" name="Employer" stackId="a" fill="#3b82f6" />
          <Bar dataKey="eps" name="Pension" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
