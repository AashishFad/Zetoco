import ZetocoLogo from './ZetocoLogo';
import { APP_NAME, APP_TAGLINE } from '../../constants';

export default function Footer() {
  return (
    <footer className="border-t border-[#1F1F24] bg-[#080808] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <ZetocoLogo size="sm" showText />
            <span className="hidden sm:inline text-[#292930]">•</span>
            <p className="text-xs text-[#71717A]">High-velocity engineering collaboration</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#71717A]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111114] border border-[#292930] text-[11px] text-[#A1A1AA]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>All Systems Operational</span>
            </span>
            <span className="text-[#292930]">•</span>
            <span>© 2026 Zetoco. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
