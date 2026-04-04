import { FC, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from './state/user/userSlice';
import AppRoutes from './routes';
import { ToastProvider } from './context/ToastContext';
import Toaster from './components/Toaster';
import './assets/styles/tailwind.css';

export const App: FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check authentication status when the app loads
    dispatch(checkAuthStatus() as any);
  }, [dispatch]);

  return (
    <ToastProvider>
      <div className="h-screen w-screen">
        <AppRoutes />
      </div>
      <Toaster />
    </ToastProvider>
  );
};
