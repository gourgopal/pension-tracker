"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProjectionArea } from "./Charts/ProjectionArea";
import { calculateProjection, ProjectionDataPoint } from "@/lib/projection-math";

interface ProjectionCalculatorProps {
  currentCorpus: number;
  monthlyContribution: number;
}

export function ProjectionCalculator({ currentCorpus, monthlyContribution }: ProjectionCalculatorProps) {
  const [interestRate, setInterestRate] = useState(8.25);
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(58);
  const [salaryGrowth, setSalaryGrowth] = useState(5);
  const [projectionData, setProjectionData] = useState<ProjectionDataPoint[]>([]);

  useEffect(() => {
    if (retirementAge > currentAge) {
      const data = calculateProjection(
        currentCorpus,
        monthlyContribution,
        interestRate,
        currentAge,
        retirementAge,
        salaryGrowth
      );
      setProjectionData(data);
    }
  }, [currentCorpus, monthlyContribution, interestRate, currentAge, retirementAge, salaryGrowth]);

  const finalCorpus = projectionData.length > 0 ? projectionData[projectionData.length - 1].corpus : 0;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-800">Retirement Projection</CardTitle>
        <p className="text-sm text-slate-500">
          See how your EPF corpus could grow by retirement age.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="space-y-6 lg:col-span-1">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-slate-700">Expected Interest Rate (%)</Label>
                <span className="font-medium text-blue-600">{interestRate}%</span>
              </div>
              <Slider 
                value={[interestRate]} 
                onValueChange={(val: any) => setInterestRate(val[0])} 
                max={12} 
                step={0.05} 
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-slate-700">Current Age</Label>
                <span className="font-medium text-blue-600">{currentAge}</span>
              </div>
              <Slider 
                value={[currentAge]} 
                onValueChange={(val: any) => setCurrentAge(val[0])} 
                min={18}
                max={60} 
                step={1} 
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-slate-700">Retirement Age</Label>
                <span className="font-medium text-blue-600">{retirementAge}</span>
              </div>
              <Slider 
                value={[retirementAge]} 
                onValueChange={(val: any) => setRetirementAge(val[0])} 
                min={40}
                max={70} 
                step={1} 
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-slate-700">Annual Salary Growth (%)</Label>
                <span className="font-medium text-blue-600">{salaryGrowth}%</span>
              </div>
              <Slider 
                value={[salaryGrowth]} 
                onValueChange={(val: any) => setSalaryGrowth(val[0])} 
                max={20} 
                step={1} 
                className="py-2"
              />
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-800 font-medium mb-1">Projected Retirement Corpus</p>
              <p className="text-3xl font-bold text-blue-700">{formatCurrency(finalCorpus)}</p>
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <ProjectionArea data={projectionData} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
