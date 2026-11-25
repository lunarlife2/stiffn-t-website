import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Nunito } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

/** Darumadrop One (copied from the app's Resource/Fonts, SIL OFL 1.1). */
const daruma = localFont({
  src: "../fonts/DarumadropOne-Regular.ttf",
  variable: "--font-daruma",
  display: "swap",
});

/** Web fallback for SF Pro Rounded (not licensed for the web): only used where ui-rounded isn't available. */
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000",
  ),
  title: {
    default: "Stiffn't: stretch breaks with a cat who checks on you",
    template: "%s · Stiffn't",
  },
  // DRAFT COPY
  description:
    "Stiffn't is a Mac menu-bar app where Steven, a black cat, reminds you to take short stretch breaks. Stretch, earn coins, and spend them on silly ways to play with him.",
  applicationName: "Stiffn't",
  openGraph: { siteName: "Stiffn't", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#cff193", // greenPrimary300, the header's colour
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${daruma.variable} ${nunito.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
