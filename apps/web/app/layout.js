import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";
import { SiteNavbar } from "./components/SiteNavbar";

export const metadata = {
  title: "Nibble — Save & Organize Your Recipes",
  description:
    "Capture recipes from photos, manage ingredients, and organize your favorite dishes with Nibble.",
  icons: {
    icon: "/icon.png",
  },
};

export const viewport = {
  themeColor: "#34754A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Finger+Paint&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SiteNavbar />
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
