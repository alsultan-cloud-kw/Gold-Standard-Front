/**
 * TRADING & VIRTUAL WALLET — temporarily disabled.
 * Routes, nav links, dashboard tabs, and wallet checkout are gated on this flag.
 */
export const TRADING_AND_VIRTUAL_WALLET_ENABLED = false;

/** Website checkout: KNET + cash on delivery only. */
export const CHECKOUT_CREDIT_CARD_ENABLED = false;
export const CHECKOUT_COD_ENABLED = true;

/** Customer bank change request workflow (admin approve/reject). */
export const BANK_CHANGE_REQUESTS_ENABLED = false;

export const TRADING_DASHBOARD_TABS = ['locked_gold', 'trade_gold', 'transactions'] as const;

export function isTradingDashboardTab(tab: string): boolean {
  return (TRADING_DASHBOARD_TABS as readonly string[]).includes(tab);
}
