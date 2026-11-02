export type MortgageInput = {
  price: number;
  downPercent: number;
  years: number;
  rate: number;
  annualTax: number;
  hoa: number;
  annualInsurance?: number;
  monthlyPmi?: number;
};

export function calculateMortgage({
  price,
  downPercent,
  years,
  rate,
  annualTax,
  hoa,
  annualInsurance = 0,
  monthlyPmi = 0,
}: MortgageInput) {
  if (
    ![price, downPercent, years, rate, annualTax, hoa, annualInsurance, monthlyPmi].every(
      Number.isFinite,
    ) ||
    price < 0 ||
    downPercent < 0 ||
    downPercent > 100 ||
    years <= 0 ||
    rate < 0 ||
    annualTax < 0 ||
    hoa < 0 ||
    annualInsurance < 0 ||
    monthlyPmi < 0
  )
    throw new RangeError('Invalid mortgage inputs.');
  const principal = price * (1 - downPercent / 100),
    months = years * 12,
    monthlyRate = rate / 1200;
  const interest =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  const tax = annualTax / 12,
    insurance = annualInsurance / 12;
  return {
    principalAndInterest: interest,
    tax,
    hoa,
    insurance,
    pmi: monthlyPmi,
    total: interest + tax + hoa + insurance + monthlyPmi,
    principal,
    downPayment: (price * downPercent) / 100,
  };
}
