import { describe, expect, it } from 'vitest';
import { calculateMortgage, type MortgageInput } from '@/lib/mortgage';

const base: MortgageInput = {
  price: 300000,
  downPercent: 20,
  years: 30,
  rate: 6.5,
  annualTax: 3600,
  hoa: 75,
};

describe('mortgage payment breakdown', () => {
  it('includes annual insurance and monthly PMI without changing principal and interest', () => {
    const original = calculateMortgage(base);
    const covered = calculateMortgage({ ...base, annualInsurance: 1800, monthlyPmi: 90 });
    expect(original.principalAndInterest).toBeCloseTo(1516.9633, 3);
    expect(covered.principalAndInterest).toBe(original.principalAndInterest);
    expect(covered.insurance).toBe(150);
    expect(covered.pmi).toBe(90);
    expect(covered.total - original.total).toBeCloseTo(240);
    expect(covered.total).toBeCloseTo(
      covered.principalAndInterest + covered.tax + covered.hoa + covered.insurance + covered.pmi,
    );
  });
  it('keeps insurance optional and handles zero interest and a fully paid home', () => {
    expect(calculateMortgage({ ...base, rate: 0 }).principalAndInterest).toBeCloseTo(240000 / 360);
    const paid = calculateMortgage({ ...base, downPercent: 100 });
    expect(paid.principalAndInterest).toBe(0);
    expect(paid.insurance).toBe(0);
    expect(paid.pmi).toBe(0);
    expect(paid.total).toBe(375);
  });
  it('rejects invalid insurance costs', () => {
    expect(() => calculateMortgage({ ...base, annualInsurance: -1 })).toThrow(RangeError);
    expect(() => calculateMortgage({ ...base, monthlyPmi: Number.NaN })).toThrow(RangeError);
  });
});
