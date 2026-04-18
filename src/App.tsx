import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileLayout } from "./components/MobileLayout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import BookPage from "./pages/BookPage";
import SeatsPage from "./pages/SeatsPage";
import ConfirmPage from "./pages/ConfirmPage";
import TicketPage from "./pages/TicketPage";
import BookingsPage from "./pages/BookingsPage";
import ProfilePage from "./pages/ProfilePage";
import StrikesPage from "./pages/StrikesPage";
import AppealPage from "./pages/AppealPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/seats" element={<SeatsPage />} />
            <Route path="/confirm" element={<ConfirmPage />} />
            <Route path="/ticket/:id" element={<TicketPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/strikes" element={<StrikesPage />} />
            <Route path="/appeal/:strikeId" element={<AppealPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
