'use client';

export default function Footer() {
  return (
    <footer className="md:ml-64 bg-white border-t border-slate-200 mt-auto">
      <div className="mx-auto py-6 px-6">
        <p className="text-center text-sm text-slate-500">
          © {new Date().getFullYear()} DecentralizedClaim. All rights reserved.
        </p>
      </div>
    </footer>
  );
}