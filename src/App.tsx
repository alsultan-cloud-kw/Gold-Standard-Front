import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './App.css'

// Layout Components
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

// Page Components
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SsoCallbackPage from './pages/SsoCallbackPage'
import ClerkAuthBridge from './components/auth/ClerkAuthBridge'
import GoogleOneTapPrompt from './components/auth/GoogleOneTapPrompt'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import UserDashboard from './pages/UserDashboard'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import BranchesPage from './pages/BranchesPage'
import PricesPage from './pages/PricesPage'
import CompanyPricesPage from './pages/CompanyPricesPage'
import NewsPage from './pages/NewsPage'
import TermsOfServiceAndPrivacyPolicyPage from './pages/TermsOfServiceAndPrivacyPolicyPage'
import DataDeletionPage from './pages/DataDeletionPage'

// Admin Components
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
import FloatingPriceReminder from './components/reminders/FloatingPriceReminder'

// Context
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'

import { ProtectedRoute, StaffRoute } from './components/routing/ProtectedRoute'

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
          <CartProvider>
          <Router>
            <GoogleOneTapPrompt />
            <div className="min-h-screen bg-siteBg">
              <Navbar />
              <main className="pt-24">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:slug" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/sso-callback" element={<SsoCallbackPage />} />
                  <Route path="/join-club" element={<JoinClubPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <UserDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/branches" element={<BranchesPage />} />
                  <Route path="/prices" element={<PricesPage />} />
                  <Route path="/company-prices" element={<CompanyPricesPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/terms-and-privacy" element={<TermsOfServiceAndPrivacyPolicyPage />} />
                  <Route path="/terms" element={<Navigate to="/terms-and-privacy" replace />} />
                  <Route path="/privacy" element={<Navigate to="/terms-and-privacy" replace />} />
                  <Route path="/data-deletion" element={<DataDeletionPage />} />
                  <Route path="/sell-gold" element={<SellGoldPage />} />
                  <Route path="/trade-gold" element={<TradeGoldPage />} />

                  {/* Admin routes: staff roles only (see StaffRoute) */}
                  <Route element={<StaffRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/categories" element={<AdminCategories />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/checkout-payment" element={<AdminCheckoutPayment />} />
                    <Route path="/admin/trading/buybacks" element={<AdminTradingBuybacks />} />
                    <Route path="/admin/trading/virtual-gold" element={<AdminTradingVirtualGold />} />
                    <Route path="/admin/inventory" element={<AdminInventory />} />
                    <Route path="/admin/prices" element={<AdminPrices />} />
                    <Route path="/admin/scrapped-data" element={<AdminScrappedData />} />
                    <Route path="/admin/bank-requests" element={<AdminBankChangeRequests />} />
                    <Route path="/admin/customers" element={<AdminCustomers />} />
                    <Route path="/admin/customers/:userId" element={<AdminCustomerDetailPage />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/accounting" element={<AdminAccounting />} />
                    <Route path="/admin/accounting/accounts" element={<AdminAccounts />} />
                    <Route path="/admin/accounting/journal" element={<AdminJournal />} />
                    <Route path="/admin/accounting/purchases" element={<AdminPurchases />} />
                    <Route path="/admin/accounting/expenses" element={<AdminExpenses />} />
                    <Route path="/admin/accounting/reports" element={<AdminFinancialReports />} />
                    <Route path="/admin/accounting/wallet" element={<AdminWallet />} />
                    <Route path="/admin/invoices" element={<AdminInvoices />} />
                    <Route path="/admin/invoices/templates" element={<AdminInvoiceTemplates />} />
                    <Route path="/admin/invoices/terms" element={<AdminInvoiceTerms />} />
                    <Route path="/admin/clubs" element={<AdminClubs />} />
                  </Route>
                </Routes>
              </main>
              <Footer />
              <FloatingPriceReminder />
              <Toaster 
                position="top-right" 
                toastOptions={{
                  style: {
                    background: '#1F2937',
                    color: '#F4E4BC',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                  },
                }}
              />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
