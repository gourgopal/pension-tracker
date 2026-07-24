"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";
import { EPFData } from "@/lib/types";

interface BreakdownPieProps {
  data: EPFData;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"];

export function BreakdownPie({ data }: BreakdownPieProps) {
  const totalEE = data.openingBalanceEE + data.transactions.filter(t => !t.isInterest).reduce((acc, curr) => acc + curr.eeShare, 0);
  const totalER = data.openingBalanceER + data.transactions.filter(t => !t.isInterest).reduce((acc, curr) => acc + curr.erShare, 0);
  const totalEPS = data.openingBalanceEPS + data.transactions.reduce((acc, curr) => acc + curr.epsShare, 0);
  const totalInterest = data.transactions.filter(t => t.isInterest).reduce((acc, curr) => acc + curr.eeShare + curr.erShare, 0);

  const chartData = [
    { name: "Employee Share", value: totalEE },
    { name: "Employer Share", value: totalER },
    { name: "Total Interest", value: totalInterest },
    { name: "Pension (EPS)", value: totalEPS }
  ].filter(item => item.value > 0);

  const formatTooltip = (value: any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={formatTooltip} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
