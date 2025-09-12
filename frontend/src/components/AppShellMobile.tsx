import React from "react";

export default function AppShellMobile({
  title, right, children,
}: { title:string; right?:React.ReactNode; children:React.ReactNode }) {
  return (
    <div className="container-phone">
      <header className="header-dark px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="h2">{title}</h1>
          {right ?? null}
        </div>
      </header>
      <main className="px-5 py-5">{children}</main>
    </div>
  );
}
