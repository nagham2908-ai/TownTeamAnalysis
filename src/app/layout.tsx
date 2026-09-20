import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Town Team — WFC Requirements Questionnaire",
  description: "Oracle Fusion HCM Workforce Compensation requirements questionnaire",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
