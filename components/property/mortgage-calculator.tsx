'use client';
import { useState } from 'react';
import { calculateMortgage, type MortgageInput } from '@/lib/mortgage';
import { money } from '@/lib/utils';
import { Share } from './share';
export function MortgageCalculator({
  price,
  tax,
  hoa = 0,
}: {
  price: number;
  tax: number;
  hoa?: number;
}) {
  const defaults: MortgageInput = {
    price,
    annualTax: tax,
    downPercent: 20,
    years: 30,
    rate: 6.5,
    hoa,
    annualInsurance: 0,
    monthlyPmi: 0,
  };
  const [input, setInput] = useState(defaults);
  const result = calculateMortgage(input);
  const change = (key: keyof MortgageInput, value: number) =>
    setInput((current) => ({ ...current, [key]: Math.max(0, Number.isFinite(value) ? value : 0) }));
  const split = [
    { label: 'Principal & Interest', value: result.principalAndInterest, color: 'var(--accent)' },
    { label: 'Property Taxes', value: result.tax, color: '#a49b88' },
    { label: 'HOA Dues', value: result.hoa, color: '#ddd6c8' },
    { label: 'Home Insurance', value: result.insurance, color: '#708c78' },
    { label: 'Mortgage Insurance', value: result.pmi, color: '#8c819f' },
  ];
  let percent = 0;
  const gradient = split
    .map((item) => {
      const from = percent;
      percent += result.total ? (item.value / result.total) * 100 : 0;
      return `${item.color} ${from}% ${percent}%`;
    })
    .join(',');
  return (
    <section className="mortgage-section" id="mortgage">
      <p className="eyebrow">A clearer picture</p>
      <h2>Estimated Monthly Payment</h2>
      <div className="calculator-layout">
        <div className="form">
          <div className="form-row">
            <label>
              Home Price
              <input
                type="number"
                min="0"
                value={input.price}
                onChange={(e) => change('price', +e.target.value)}
              />
            </label>
            <label>
              Term
              <select value={input.years} onChange={(e) => change('years', +e.target.value)}>
                {[10, 15, 20, 25, 30].map((y) => (
                  <option key={y} value={y}>
                    {y}-year fixed
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Down Payment (%)
              <input
                type="number"
                min="0"
                max="100"
                value={input.downPercent}
                onChange={(e) => change('downPercent', Math.min(100, +e.target.value))}
              />
            </label>
            <label>
              Down Payment ($)
              <input
                type="number"
                min="0"
                max={input.price}
                value={Math.round(result.downPayment)}
                onChange={(e) =>
                  change(
                    'downPercent',
                    input.price ? Math.min(100, (+e.target.value / input.price) * 100) : 0,
                  )
                }
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Interest Rate (%)
              <input
                type="number"
                min="0"
                max="30"
                step=".1"
                value={input.rate}
                onChange={(e) => change('rate', Math.min(30, +e.target.value))}
              />
            </label>
            <label>
              Property Tax (annual $)
              <input
                type="number"
                min="0"
                value={input.annualTax}
                onChange={(e) => change('annualTax', +e.target.value)}
              />
            </label>
          </div>
          <label>
            HOA Dues (monthly $)
            <input
              type="number"
              min="0"
              value={input.hoa}
              onChange={(e) => change('hoa', +e.target.value)}
            />
          </label>
          <div className="form-row">
            <label>
              Home Insurance (annual $)
              <input
                type="number"
                min="0"
                value={input.annualInsurance}
                onChange={(e) => change('annualInsurance', +e.target.value)}
              />
            </label>
            <label>
              Mortgage Insurance (monthly $)
              <input
                type="number"
                min="0"
                value={input.monthlyPmi}
                onChange={(e) => change('monthlyPmi', +e.target.value)}
              />
            </label>
          </div>
          <button className="text-link" onClick={() => setInput(defaults)}>
            Reset
          </button>
        </div>
        <div className="mortgage-result">
          <div
            className="payment-donut"
            style={{ background: result.total ? `conic-gradient(${gradient})` : 'var(--line)' }}
          >
            <div>
              <p className="eyebrow">Your Payment</p>
              <p className="payment-total" aria-live="polite">
                {money(result.total)}
              </p>
              <span>per month</span>
            </div>
          </div>
          <div className="payment-breakdown">
            {split.map((s) => (
              <div key={s.label}>
                <span style={{ background: s.color }} />
                <p>{s.label}</p>
                <strong>{money(s.value)}</strong>
                <small>{result.total ? Math.round((s.value / result.total) * 100) : 0}%</small>
              </div>
            ))}
          </div>
          <Share title="Mortgage estimate | The Ellison Group" />
        </div>
      </div>
      <p className="demo-note">
        Estimates for informational purposes only. The example rate is an editable illustration, not
        a lending offer. Enter insurance and mortgage insurance amounts to include them in your
        estimate. Closing costs and lender fees are excluded.
      </p>
    </section>
  );
}
