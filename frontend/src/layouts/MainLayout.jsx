import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";

export default function MainLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Outlet />
    </div>
  );
}