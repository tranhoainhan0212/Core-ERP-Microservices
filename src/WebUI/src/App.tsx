import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';
import Header from './components/Header';
import { CartPageSkeleton, HomePageSkeleton } from './components/PageSkeleton';
import ToastStack from './components/ToastStack';
import ProductDetailPage from './pages/ProductDetailPage';
import OAuthCallback from './pages/OAuthCallback';
import AdminDashboard from './pages/AdminDashboard';
import ChatWidget from './components/ChatWidget';

const HomePage = lazy(() => import('./pages/HomePage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const SplineLoginPage = lazy(() => import('./pages/SplineLoginPage'));
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage'));

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isLandingRoute = location.pathname === '/login';
  const hideLayout = isAdminRoute || isLandingRoute;

  return (
    <div className={isAdminRoute ? '' : 'min-h-screen bg-[#030712] text-slate-200'}>
      <ToastStack />
      {!hideLayout && <Header />}
      <main>
        <Routes>
          <Route
            path="/"
            element={(
              <Suspense fallback={<HomePageSkeleton />}>
                <HomePage />
              </Suspense>
            )}
          />
          <Route
            path="/cart"
            element={(
              <Suspense fallback={<CartPageSkeleton />}>
                <CartPage />
              </Suspense>
            )}
          />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={(
            <Suspense fallback={<div className="h-screen bg-black" />}>
              <SplineLoginPage />
            </Suspense>
          )} />
          <Route path="/oauth2/google/callback" element={<OAuthCallback />} />
          <Route
            path="/payment-result"
            element={(
              <Suspense fallback={<div className="min-h-screen bg-[#030712]" />}>
                <PaymentResultPage />
              </Suspense>
            )}
          />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
      {!isAdminRoute && <ChatWidget />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppLayout />
    </ErrorBoundary>
  );
}

export default App;
