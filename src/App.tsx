import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return (
    <div className="min-w-[1024px]">
      <RouterProvider router={router} />
    </div>
  );
}