/**
 * TRADING & VIRTUAL WALLET — OFF (commented out of customer UI).
 * Routes, nav links (تداول الذهب), dashboard tabs, and wallet checkout are gated on this flag.
 * Keep code in repo; flip to `true` only when the trading desk is ready to ship.
 */
export const TRADING_AND_VIRTUAL_WALLET_ENABLED = false;

/**
 * Wallet funding + wallet-as-payment — OFF until deposits are gateway-backed.
 *
 * `POST /accounting/wallet/deposit/` credits a client-supplied amount with no
 * payment gateway in the loop, and a wallet order settles as `paid` immediately,
 * so exposing both together let a customer self-fund and check out for free.
 * The endpoint is now admin-only server-side; this flag hides the client half.
 *
 * Deliberately separate from `TRADING_AND_VIRTUAL_WALLET_ENABLED`, which is the
 * master switch for the whole Trade feature — do not conflate them.
 * Re-enable only once deposits require a confirmed KNET payment.
 */
export const WALLET_FUNDING_AND_CHECKOUT_ENABLED = false;

/**
 * Digital metal holdings (/holdings + dashboard الحيازات).
 * When false: page stays visible as a beta tease (strip + preview), trading is not live.
 * Flip to true to remove the beta strip and enable live stats / buy–sell.
 */
export const HOLDINGS_LIVE_ENABLED = false;

/**
 * Checkout “keep in vault” delivery — independent of trading/wallet.
 * Gold is stored with the store (not shipped), billed, and shown on receipt/orders.
 */
export const CHECKOUT_VAULT_DELIVERY_ENABLED = true;

/** Website checkout: KNET + cash on delivery only. */
export const CHECKOUT_CREDIT_CARD_ENABLED = false;
export const CHECKOUT_COD_ENABLED = true;

/** Customer bank change request workflow (admin approve/reject). */
export const BANK_CHANGE_REQUESTS_ENABLED = true;

export const TRADING_DASHBOARD_TABS = ['locked_gold', 'trade_gold', 'transactions'] as const;

export function isTradingDashboardTab(tab: string): boolean {
  return (TRADING_DASHBOARD_TABS as readonly string[]).includes(tab);
}
