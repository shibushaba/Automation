import { QRCodeSVG } from 'qrcode.react';

const BASE = window.location.origin + window.location.pathname.replace(/\/?$/, '');
const CUSTOMER_URL = `${BASE}/#/customer`;
const STAFF_URL    = `${BASE}/#/staff`;

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav bar */}
      <header className="border-b border-ink bg-white flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-ink flex items-center justify-center">
            <span className="text-white font-black text-sm tracking-widest">Z</span>
          </div>
          <div>
            <p className="font-black text-sm tracking-[0.3em] uppercase text-ink">ZECHAI</p>
            <p className="font-mono text-[9px] tracking-widest text-gray-400 uppercase">Cafe · Est. 2024</p>
          </div>
        </div>
        <p className="font-mono text-[10px] tracking-widest text-gray-400 uppercase hidden sm:block">
          [ Feedback System ]
        </p>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="mb-12 text-center">
          <p className="section-label mb-3">[ Scan to Share ]</p>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-ink leading-none">
            YOUR<br/>VOICE<br/>MATTERS
          </h1>
          <div className="mt-4 h-1 w-16 bg-primary mx-auto" />
        </div>

        {/* QR Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-ink w-full max-w-2xl">
          {/* Customer */}
          <div className="border-r-0 sm:border-r border-b sm:border-b-0 border-ink p-8 bg-white flex flex-col gap-6 group hover:bg-ink transition-colors duration-200">
            <div>
              <span className="badge badge-primary group-hover:border-primary group-hover:text-primary mb-3">
                Customer
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-ink group-hover:text-white transition-colors">
                Customer<br/>Feedback
              </h2>
              <p className="font-mono text-[11px] text-gray-400 mt-1 group-hover:text-gray-400">
                Share your experience with us
              </p>
            </div>
            <div className="self-start p-3 border border-ink bg-white">
              <QRCodeSVG value={CUSTOMER_URL} size={150} fgColor="#e1492c" bgColor="#ffffff" level="M" />
            </div>
            <p className="font-mono text-[9px] text-gray-400 break-all">{CUSTOMER_URL}</p>
          </div>

          {/* Staff */}
          <div className="p-8 bg-white flex flex-col gap-6 group hover:bg-ink transition-colors duration-200">
            <div>
              <span className="badge badge-accent group-hover:border-accent group-hover:text-accent mb-3">
                Staff
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-ink group-hover:text-white transition-colors">
                Daily<br/>Report
              </h2>
              <p className="font-mono text-[11px] text-gray-400 mt-1 group-hover:text-gray-400">
                End-of-day wrap-up report
              </p>
            </div>
            <div className="self-start p-3 border border-ink bg-white">
              <QRCodeSVG value={STAFF_URL} size={150} fgColor="#2596be" bgColor="#ffffff" level="M" />
            </div>
            <p className="font-mono text-[9px] text-gray-400 break-all">{STAFF_URL}</p>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-0 border border-t-0 border-ink w-full max-w-2xl bg-ink px-8 py-3 flex items-center justify-between">
          <p className="font-mono text-[9px] text-gray-400 tracking-widest uppercase">
            © {new Date().getFullYear()} ZECHAI
          </p>
          <p className="font-mono text-[9px] text-gray-500 tracking-widest uppercase">
            All rights reserved
          </p>
        </div>
      </main>
    </div>
  );
}
