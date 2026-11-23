"use client";

import GuestLoginEffect from "@/components/HomePage/GuestLoginEffect";

export default function ClientLayout({ children }) {
  return (
    <>
      <GuestLoginEffect />
      <div className="flex flex-col min-h-screen max-w-3xl m-auto">
        <div className="text-white bg-[#0F0B1A] flex-grow">{children}</div>
      </div>
    </>
  );
}
