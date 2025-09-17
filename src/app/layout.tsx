export const metadata = { title: "Dressage Visualizer", description: "USDF Intro A demo" };

import "./globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
