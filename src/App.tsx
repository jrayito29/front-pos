import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './app/queryClient';
import { AppRouter } from './app/router';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <AppRouter />
    </QueryClientProvider>
  );
}

export default App
