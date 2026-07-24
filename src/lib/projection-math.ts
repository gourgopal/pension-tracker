export interface ProjectionDataPoint {
  age: number;
  year: number;
  corpus: number;
  invested: number;
  interest: number;
}

export const calculateProjection = (
  currentCorpus: number,
  monthlyContribution: number,
  annualInterestRate: number, // e.g. 8.25
  currentAge: number,
  retirementAge: number,
  annualSalaryGrowth: number = 5 // 5% default salary growth
): ProjectionDataPoint[] => {
  const data: ProjectionDataPoint[] = [];
  
  let balance = currentCorpus;
  let invested = currentCorpus;
  let currentMonthlyContribution = monthlyContribution;
  let totalInterest = 0;
  
  const currentYear = new Date().getFullYear();
  const rate = annualInterestRate / 100;

  for (let age = currentAge; age <= retirementAge; age++) {
    // Annual simulation
    const yearIndex = age - currentAge;
    
    // 12 months of contributions
    let yearlyContribution = 0;
    for (let m = 0; m < 12; m++) {
      balance += currentMonthlyContribution;
      yearlyContribution += currentMonthlyContribution;
    }
    
    // Add interest at the end of the year on the opening balance + half of yearly contribution (approximate EPF rule)
    // EPF interest is calculated monthly on the opening balance of the month.
    // So annual interest is approx: (opening_balance * r) + (yearly_contribution * r / 2)
    const openingBalance = balance - yearlyContribution;
    const yearInterest = (openingBalance * rate) + (yearlyContribution * (rate / 2));
    
    balance += yearInterest;
    totalInterest += yearInterest;
    invested += yearlyContribution;

    data.push({
      age,
      year: currentYear + yearIndex,
      corpus: Math.round(balance),
      invested: Math.round(invested),
      interest: Math.round(totalInterest)
    });

    // Increase contribution for next year based on salary growth
    currentMonthlyContribution *= (1 + (annualSalaryGrowth / 100));
  }

  return data;
};
