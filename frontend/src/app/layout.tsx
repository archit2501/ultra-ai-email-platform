import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SkipLink } from "@/components/ui/skip-link";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Metaminds - AI-Powered Recruitment Platform",
  description: "Next-generation HR platform with intelligent job application management, recipient groups, and campaign analytics",
  icons: {
    icon: "/metaminds-logo.jpg",
    shortcut: "/metaminds-logo.jpg",
    apple: "/metaminds-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <SkipLink href="#main-content" />
          <div id="main-content">{children}</div>
          <Toaster
            position="top-right"
            richColors
            expand={false}
            duration={4000}
            closeButton
            toastOptions={{
              classNames: {
                toast: "border shadow-premium-lg backdrop-blur-sm",
                title: "font-semibold",
                description: "text-muted-foreground text-sm",
                actionButton: "bg-primary text-primary-foreground hover:bg-primary/90",
                cancelButton: "bg-muted text-muted-foreground hover:bg-muted/80",
                closeButton: "bg-background border border-border hover:bg-muted",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
