import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-transparent text-[var(--text)]">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="flex-1 px-4 pb-4 pt-3 md:px-6 md:pb-6 md:pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}