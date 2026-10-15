import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080808] text-[#F5F5F7] selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
