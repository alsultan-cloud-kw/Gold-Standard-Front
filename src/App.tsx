import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './App.css'

// Layout Components
import AppChrome from './components/layout/AppChrome'
import SkipToContentLink from './components/layout/SkipToContentLink'

// Page Components
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductAuthenticityPage from './pages/ProductAuthenticityPage'
import DigitalPassportPage, { VerifyUnitRedirect } from './pages/DigitalPassportPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import KnetReceiptPage from './pages/KnetReceiptPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SsoCallbackPage from './pages/SsoCallbackPage'
import ClerkAuthBridge from './components/auth/ClerkAuthBridge'
import AuthSuccessNotifier from './components/auth/AuthSuccessNotifier'
import GoogleOneTapPrompt from './components/auth/GoogleOneTapPrompt'
import AuthTransitionOverlay from './components/auth/AuthTransitionOverlay'
import MinistryKycGate from './components/auth/MinistryKycGate'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import { KycRequiredRoute } from './components/routing/KycRequiredRoute'
import UserDashboard from './pages/UserDashboard'
import AboutPage from './pages/AboutPage'
import HoldingsPage from './pages/HoldingsPage'
import VerifyAccountPage from './pages/VerifyAccountPage'
import PublicMociKycPage from './pages/PublicMociKycPage'
import CustomerBlacklistScreenPage from './pages/CustomerBlacklistScreenPage'
import ContactPage from './pages/ContactPage'
import BranchesPage from './pages/BranchesPage'
import PricesPage from './pages/PricesPage'
import CompanyPricesPage from './pages/CompanyPricesPage'
// News temporarily hidden — re-enable with nav.news + HomeNewsSection
// import NewsPage from './pages/NewsPage'
import TermsOfServiceAndPrivacyPolicyPage from './pages/TermsOfServiceAndPrivacyPolicyPage'
import DataDeletionPage from './pages/DataDeletionPage'
import NotFoundPage from './pages/NotFoundPage'

// Admin Components
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminInventory from './pages/admin/AdminInventory'
import AdminPrices from './pages/admin/AdminPrices'
import AdminScrappedData from './pages/admin/AdminScrappedData'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminCustomerDetailPage from './pages/admin/AdminCustomerDetailPage'
import AdminBankChangeRequests from './pages/admin/AdminBankChangeRequests'
import AdminReports from './pages/admin/AdminReports'
import AdminAccounting from './pages/admin/AdminAccounting'
import AdminAccounts from './pages/admin/AdminAccounts'
import AdminJournal from './pages/admin/AdminJournal'
import AdminPurchases from './pages/admin/AdminPurchases'
import AdminExpenses from './pages/admin/AdminExpenses'
import AdminFinancialReports from './pages/admin/AdminFinancialReports'
import AdminWallet from './pages/admin/AdminWallet'
import AdminInvoices from './pages/admin/AdminInvoices'
import AdminInvoiceTemplates from './pages/admin/AdminInvoiceTemplates'
import AdminInvoiceTerms from './pages/admin/AdminInvoiceTerms'
import AdminTradingBuybacks from './pages/admin/AdminTradingBuybacks'
import AdminTradingVirtualGold from './pages/admin/AdminTradingVirtualGold'
import AdminCheckoutPayment from './pages/admin/AdminCheckoutPayment'
import SellGoldPage from './pages/SellGoldPage'
import TradeGoldPage from './pages/TradeGoldPage'
import AdminClubs from './pages/admin/AdminClubs'
import JoinClubPage from './pages/JoinClubPage'
import MarketingVisitTracker from './components/analytics/MarketingVisitTracker'
import { RouteSeo } from './components/seo/RouteSeo'

// Context
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'

import { ProtectedRoute, StaffRoute, CatalogManagerRoute, GuestOnlyRoute, StaffDashboardGate } from './components/routing/ProtectedRoute'
import ScrollToTop from './components/routing/ScrollToTop'
import { GlobalBootGate } from './components/routing/GlobalBootGate'
import { TRADING_AND_VIRTUAL_WALLET_ENABLED, BANK_CHANGE_REQUESTS_ENABLED } from './featureFlags'

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ClerkAuthBridge />
          <GlobalBootGate>
          <Router>
            <AuthSuccessNotifier />
            <CartProvider>
            <ScrollToTop />
            <RouteSeo />
            <MarketingVisitTracker />
            <GoogleOneTapPrompt />
            <AuthTransitionOverlay />
            <MinistryKycGate />
            <AppChrome>
              <SkipToContentLink />
              <main id="main-content" className="main-with-bottom-nav" tabIndex={-1}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:slug" element={<ProductDetailPage />} />
                  <Route path="/verify" element={<ProductAuthenticityPage />} />
                  <Route path="/verify/passport" element={<DigitalPassportPage />} />
                  <Route path="/verify/unit" element={<VerifyUnitRedirect />} />
                  <Route path="/gs-kyc" element={<CustomerBlacklistScreenPage />} />
                  <Route path="/customer-kyc" element={<Navigate to="/gs-kyc" replace />} />
                  <Route path="/moci-kyc" element={<PublicMociKycPage />} />
                  <Route path="/kyc" element={<Navigate to="/moci-kyc" replace />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route
                    path="/verify-account"
                    element={
                      <ProtectedRoute>
                        <VerifyAccountPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <KycRequiredRoute>
                        <CheckoutPage />
                      </KycRequiredRoute>
                    }
                  />
                  <Route path="/payment-receipt/:saleId" element={<KnetReceiptPage />} />
                  <Route element={<GuestOnlyRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  </Route>
                  <Route path="/sso-callback" element={<SsoCallbackPage />} />
                  <Route path="/join-club" element={<JoinClubPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <StaffDashboardGate>
                          <UserDashboard />
                        </StaffDashboardGate>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/trading" element={<Navigate to="/holdings" replace />} />
                  <Route
                    path="/holdings"
                    element={
                      <KycRequiredRoute>
                        <HoldingsPage />
                      </KycRequiredRoute>
                    }
                  />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/branches" element={<BranchesPage />} />
                  <Route path="/prices" element={<PricesPage />} />
                  <Route path="/company-prices" element={<CompanyPricesPage />} />
                  {/* News temporarily hidden
                  <Route path="/news" element={<NewsPage />} />
                  */}
                  <Route path="/terms-and-privacy" element={<TermsOfServiceAndPrivacyPolicyPage />} />
                  <Route path="/terms" element={<Navigate to="/terms-and-privacy" replace />} />
                  <Route path="/privacy" element={<Navigate to="/terms-and-privacy" replace />} />
                  <Route path="/data-deletion" element={<DataDeletionPage />} />
                  {TRADING_AND_VIRTUAL_WALLET_ENABLED ? (
                    <>
                      <Route
                        path="/sell-gold"
                        element={
                          <ProtectedRoute>
                            <SellGoldPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/trade-gold"
                        element={
                          <ProtectedRoute>
                            <TradeGoldPage />
                          </ProtectedRoute>
                        }
                      />
                    </>
                  ) : null}

                  {/* Admin routes: staff roles only (see StaffRoute) — shared AdminLayout keeps nav mounted */}
                  <Route element={<StaffRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route element={<CatalogManagerRoute />}>
                        <Route path="/admin/products" element={<AdminProducts />} />
                        <Route path="/admin/categories" element={<AdminCategories />} />
                      </Route>
                      <Route path="/admin/orders" element={<AdminOrders />} />
                      <Route path="/admin/checkout-payment" element={<AdminCheckoutPayment />} />
                      {TRADING_AND_VIRTUAL_WALLET_ENABLED ? (
                        <>
                          <Route path="/admin/trading/buybacks" element={<AdminTradingBuybacks />} />
                          <Route path="/admin/trading/virtual-gold" element={<AdminTradingVirtualGold />} />
                          <Route path="/admin/accounting/wallet" element={<AdminWallet />} />
                        </>
                      ) : null}
                      <Route path="/admin/inventory" element={<AdminInventory />} />
                      <Route path="/admin/prices" element={<AdminPrices />} />
                      <Route path="/admin/scrapped-data" element={<AdminScrappedData />} />
                      {BANK_CHANGE_REQUESTS_ENABLED ? (
                        <Route path="/admin/bank-requests" element={<AdminBankChangeRequests />} />
                      ) : null}
                      <Route path="/admin/customers" element={<AdminCustomers />} />
                      <Route path="/admin/customers/:userId" element={<AdminCustomerDetailPage />} />
                      <Route path="/admin/reports" element={<AdminReports />} />
                      <Route path="/admin/accounting" element={<AdminAccounting />} />
                      <Route path="/admin/accounting/accounts" element={<AdminAccounts />} />
                      <Route path="/admin/accounting/journal" element={<AdminJournal />} />
                      <Route path="/admin/accounting/purchases" element={<AdminPurchases />} />
                      <Route path="/admin/accounting/expenses" element={<AdminExpenses />} />
                      <Route path="/admin/accounting/reports" element={<AdminFinancialReports />} />
                      <Route path="/admin/invoices" element={<AdminInvoices />} />
                      <Route path="/admin/invoices/templates" element={<AdminInvoiceTemplates />} />
                      <Route path="/admin/invoices/terms" element={<AdminInvoiceTerms />} />
                      <Route path="/admin/clubs" element={<AdminClubs />} />
                      <Route path="/admin/*" element={<NotFoundPage />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Toaster
                position="top-center"
                richColors
                closeButton
                gap={10}
                offset={16}
                mobileOffset={{
                  top: 'calc(var(--nav-offset, 7.25rem) + 0.5rem)',
                  bottom: 'calc(var(--bottom-nav-height) + 0.75rem)',
                }}
                toastOptions={{
                  className: 'gs-toast',
                  style: {
                    background: '#0B0F19',
                    color: '#F8FAFC',
                    border: '1px solid rgba(133, 227, 7, 0.35)',
                    borderRadius: '14px',
                    boxShadow: '0 12px 40px rgba(11, 15, 25, 0.28)',
                    fontSize: '14px',
                    fontWeight: 600,
                    maxWidth: 'min(24rem, calc(100vw - 1.5rem))',
                  },
                  classNames: {
                    description: 'gs-toast-desc',
                    success: 'gs-toast-success',
                    error: 'gs-toast-error',
                    actionButton: 'gs-toast-action',
                  },
                }}
              />
            </AppChrome>
            </CartProvider>
          </Router>
          </GlobalBootGate>
        </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
