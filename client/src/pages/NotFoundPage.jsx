import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ZetocoLogo from '../components/common/ZetocoLogo';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-[#080808]">
      <ZetocoLogo size="2xl" symbolOnly className="mb-6 drop-shadow-xl" />
      <h1 className="text-6xl font-extrabold text-[#F5F5F7] tracking-tight">404</h1>
      <h2 className="text-xl font-semibold text-[#A1A1AA] mt-2">Page Not Found</h2>
      <p className="text-sm text-[#71717A] mt-2 max-w-sm">
        The route you are trying to access does not exist in Zetoco.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-950/60 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>
    </div>
  );
}
