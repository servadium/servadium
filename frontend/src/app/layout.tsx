import type { Metadata } from "next";
import { Jost } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const jost = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Servadium",
  description: "A real-time multimodal knowledge transfer agent — AI that learns and teaches expert knowledge.",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jost.variable} antialiased`}>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
