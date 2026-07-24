"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { ProjectionDataPoint } from "@/lib/projection-math";

interface ProjectionAreaProps {
  data: ProjectionDataPoint[];
}

export function ProjectionArea({ data }: ProjectionAreaProps) {
  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  };

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="age" 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(val) => `Age ${val}`} 
          />
          <YAxis 
            tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip formatter={formatCurrency} labelFormatter={(label) => `Age ${label}`} />
          
          <Area 
            type="monotone" 
            dataKey="corpus" 
            name="Total Corpus"
            stroke="#3b82f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorCorpus)" 
          />
          <Area 
            type="monotone" 
            dataKey="invested" 
            name="Invested Amount"
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorInvested)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
