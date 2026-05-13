// src/lib/engine/underwriter/engine.ts
import { 
  UnderwritingInput, 
  UnderwritingResult, 
  BudgetGroup, 
  FinancingTerms, 
  FixedCosts,
  StrategyType
} from './types'

/**
 * Deterministic Underwriting Engine
 * Meets professional standards for real estate deal evaluation.
 */
export class Underwriter {
  
  static evaluate(input: UnderwritingInput): UnderwritingResult {
    const isMAOPath = !input.purchase_price;
    
    // 1. Calculate Weighted ARV from Comps (if available)
    const calculatedARV = this.calculateWeightedARV(input.comps || [], input.arv);
    const effectiveARV = input.arv_override || calculatedARV;
    
    // 2. Calculate Costs (Deterministic)
    const rehabTotal = this.sumBudget(input.rehab_budget);
    const fixedCostsTotal = this.sumFixedCosts(input.fixed_costs);
    
    // 3. Dual-Path Execution
    let purchasePrice = input.purchase_price || 0;
    if (isMAOPath) {
      purchasePrice = this.calculateMAO(effectiveARV, rehabTotal, fixedCostsTotal, input);
    }

    // 4. Financing & Carrying Costs
    const financing = this.calculateFinancing(purchasePrice, rehabTotal, input.financing, input.holding_period_months);
    
    // 5. Performance Metrics (Strategy-Specific)
    const metrics = this.calculateMetrics(purchasePrice, effectiveARV, rehabTotal, fixedCostsTotal, financing, input);

    // 6. Audit Trail & Response
    return {
      success: true,
      path: isMAOPath ? 'mao' : 'performance',
      strategy: input.strategy,
      metrics,
      sources_and_uses: {
        loan_amount: financing.loan_amount,
        equity_required: financing.equity_required,
        total_project_cost: purchasePrice + rehabTotal + fixedCostsTotal + financing.total_cost,
        rehab_allocation: rehabTotal,
        financing_fees: financing.fees,
        carrying_costs: financing.interest_carry,
        fixed_costs_total: fixedCostsTotal
      },
      warnings: this.generateWarnings(metrics, input),
      audit_trail: {
        original_values: { arv: input.arv, comps_count: input.comps?.length || 0 },
        user_overrides: { arv: input.arv_override },
        intermediate_calculations: {
          calculated_arv: calculatedARV,
          rehab_total: rehabTotal,
          fixed_costs: fixedCostsTotal,
          financing_details: financing
        }
      }
    };
  }

  private static calculateWeightedARV(comps: any[], fallbackARV: number): number {
    if (!comps || comps.length === 0) return fallbackARV;
    
    let totalWeight = 0;
    let weightedSum = 0;

    comps.forEach(comp => {
      const weight = comp.similarity_score || 1;
      weightedSum += (comp.sale_price || 0) * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : fallbackARV;
  }

  private static calculateMetrics(
    purchasePrice: number, 
    arv: number, 
    rehab: number, 
    fixed: number, 
    financing: any, 
    input: UnderwritingInput
  ) {
    const totalProjectCost = purchasePrice + rehab + fixed + financing.total_cost;
    const totalEquity = totalProjectCost - financing.loan_amount;
    const exitCommission = arv * (input.fixed_costs.commissions_pct / 100);
    
    const netProfit = arv - exitCommission - totalProjectCost;
    const roi = totalProjectCost > 0 ? (netProfit / totalProjectCost) * 100 : 0;
    
    // CoC Logic (with Infinite Return detection)
    let coc = 0;
    let isInfiniteCoC = false;
    if (totalEquity <= 0 && netProfit > 0) {
      isInfiniteCoC = true;
      coc = 999999; // Represents Infinite
    } else if (totalEquity > 0) {
      coc = (netProfit / totalEquity) * 100;
    }

    let strategyMetrics: any = {
      net_profit: netProfit,
      roi_pct: roi,
      coc_pct: coc,
      is_infinite_return: isInfiniteCoC,
      equity_multiple: totalEquity > 0 ? (netProfit + totalEquity) / totalEquity : 0,
      annualized_return_pct: coc * (12 / input.holding_period_months),
      mao: this.calculateMAO(arv, rehab, fixed, input)
    };

    // Rental Specifics
    if (input.strategy === 'rental' || input.strategy === 'brrrr') {
      const monthlyRent = input.rent_estimate_monthly || 0;
      const opExRatio = input.operating_expenses_pct || 40;
      const monthlyNOI = monthlyRent * (1 - opExRatio / 100);
      const annualNOI = monthlyNOI * 12;
      const annualDebtService = financing.monthly_payment * 12;
      
      const monthlyCashFlow = monthlyNOI - financing.monthly_payment;
      
      strategyMetrics.noi = annualNOI;
      strategyMetrics.cap_rate = arv > 0 ? annualNOI / arv : 0;
      strategyMetrics.dscr = annualDebtService > 0 ? annualNOI / annualDebtService : 0;
      strategyMetrics.cash_flow_monthly = monthlyCashFlow;
      
      // Break-even months (Capital Recapture)
      strategyMetrics.break_even_months = monthlyCashFlow > 0 ? totalEquity / monthlyCashFlow : -1;
    }

    // BRRRR Specifics (Refinance Recapture)
    if (input.strategy === 'brrrr') {
      const refiLTV = 0.75; // Standard refi assumption
      const newLoanAmount = arv * refiLTV;
      const cashLeftInDeal = totalProjectCost - newLoanAmount;
      
      strategyMetrics.cash_left_in_deal = cashLeftInDeal;
      strategyMetrics.equity_recapture_pct = totalEquity > 0 ? ((newLoanAmount - financing.loan_amount) / totalEquity) * 100 : 0;
      
      if (cashLeftInDeal <= 0) {
        strategyMetrics.is_infinite_return = true;
      }
    }

    return strategyMetrics;
  }

  private static calculateFinancing(purchasePrice: number, rehab: number, terms: FinancingTerms, months: number) {
    const ltv = terms.ltv_pct || 75;
    const loanAmount = terms.loan_amount || (purchasePrice * ltv / 100);
    const monthlyRate = (terms.interest_rate || 0) / 100 / 12;
    const fees = (loanAmount * (terms.points || 0) / 100) + (terms.fees || 0);
    
    let monthlyPayment = 0;
    let interestCarry = 0;

    if (terms.interest_only) {
      monthlyPayment = loanAmount * ((terms.interest_rate || 0) / 100 / 12);
      interestCarry = monthlyPayment * months;
    } else {
      const n = (terms.amortization_yrs || 30) * 12;
      if (monthlyRate > 0) {
        monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
      } else {
        monthlyPayment = loanAmount / n;
      }
      interestCarry = monthlyPayment * months; // Simplification
    }

    return {
      loan_amount: loanAmount,
      equity_required: (purchasePrice + rehab + fees) - loanAmount, // Equity covers closing fees
      fees,
      interest_carry: interestCarry,
      monthly_payment: monthlyPayment,
      total_cost: fees + interestCarry
    };
  }

  private static sumBudget(groups: BudgetGroup[]): number {
    return groups.reduce((acc, group) => {
      const base = group.items.reduce((itemAcc, item) => itemAcc + (item.cost || 0), 0);
      const contingency = base * ((group.contingency_pct || 0) / 100);
      return acc + base + contingency;
    }, 0);
  }

  private static sumFixedCosts(costs: FixedCosts): number {
    return (costs.closing_costs_acq || 0) + 
           (costs.insurance || 0) + 
           (costs.utilities || 0) + 
           (costs.taxes || 0) + 
           (costs.title_fees || 0) + 
           (costs.attorney_fees || 0) + 
           (costs.permits || 0) + 
           (costs.staging || 0);
  }

  private static generateWarnings(metrics: any, input: UnderwritingInput): string[] {
    const warnings: string[] = [];
    
    // 1. Profitability Warnings
    if (metrics.roi_pct < 15) warnings.push('THIN_MARGIN: ROI is below 15%');
    if (metrics.roi_pct < 5) warnings.push('CRITICAL_MARGIN: ROI is below 5%, extremely high risk');
    
    // 2. Debt Service Warnings
    if (metrics.dscr && metrics.dscr < 1.20) warnings.push('DSCR_FAILURE: Debt service coverage is below 1.20');
    
    // 3. Strategy-Specific Warnings
    if (input.strategy === 'brrrr' && metrics.cash_left_in_deal > (input.purchase_price! * 0.10)) {
      warnings.push('HIGH_CASH_LEFT: Significant capital remains after refinance');
    }
    
    if (metrics.is_infinite_return) {
      warnings.push('INFINITE_RETURN_DETECTED: No capital remains in deal after refinance');
    }

    // 4. Sensitivity Analysis (5% ARV Drop)
    const exitCommissionPct = input.fixed_costs.commissions_pct / 100;
    const projectCost = metrics.net_profit > 0 ? (input.arv_override || input.arv) * (1 - exitCommissionPct) - metrics.net_profit : 0;
    const sensitivityARV = (input.arv_override || input.arv) * 0.95;
    const sensitivityProfit = sensitivityARV * (1 - exitCommissionPct) - projectCost;
    
    if (sensitivityProfit <= 0) {
      warnings.push('SENSITIVITY_ALERT: A 5% drop in ARV would result in a NET LOSS');
    }

    return warnings;
  }
}
