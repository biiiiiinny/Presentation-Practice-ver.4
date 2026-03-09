import { RouterProvider } from 'react-router';
import { AppProvider } from './contexts/AppContext';
import { router } from './routes';

export default function App() {
  return (
    <AppProvider>
      <div className="min-w-[1024px]">
        <RouterProvider router={router} />
      </div>
    </AppProvider>
  );
}