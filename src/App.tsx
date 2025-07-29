import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Machines from "./pages/Machines";
import Production from "./pages/Production";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={
              <>
                <Navbar />
                <Dashboard />
              </>
            } />
            <Route path="/machines" element={
              <>
                <Navbar />
                <Machines />
              </>
            } />
            <Route path="/production" element={
              <>
                <Navbar />
                <Production />
              </>
            } />
            <Route path="/reports" element={
              <>
                <Navbar />
                <div className="p-6"><h1 className="text-2xl font-bold">Relatórios - Em desenvolvimento</h1></div>
              </>
            } />
            <Route path="/settings" element={
              <>
                <Navbar />
                <div className="p-6"><h1 className="text-2xl font-bold">Configurações - Em desenvolvimento</h1></div>
              </>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
