import "./globals.css";

export const metadata = {
  title: "RecipeHelper — Save & Organize Your Recipes",
  description:
    "Capture recipes from photos, manage ingredients, and organize your favorite dishes with RecipeHelper.",
  icons: {
    icon: "/icon.png",
  },
};

export const viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
