import React from "react";
import BrailleToggle from "./BrailleToggle";

interface MobileShellProps {
  title?: string;
  brailleToggle?: boolean;
  children: React.ReactNode;
}

export default function MobileShell({ title, brailleToggle = false, children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="h-16 bg-brand-900 text-white flex items-center justify-between px-4">
        <h1 className="text-xl font-bold text-white">{title || "점글이"}</h1>
        {brailleToggle && (
          <BrailleToggle 
            on={false} 
            onChange={(v) => console.log("Braille toggle:", v)} 
          />
        )}
      </header>
      
      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        {children}
      </main>
    </div>
  );
}
