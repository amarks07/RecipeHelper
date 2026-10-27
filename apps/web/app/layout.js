import "./globals.css";

export const metadata = {
  title: "Nibble — Save & Organize Your Recipes",
  description:
    "Capture recipes from photos, manage ingredients, and organize your favorite dishes with Nibble.",
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
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Fontdiner+Swanky&display=swap" rel="stylesheet" />
        <style>{`
          * {
            --app-font: 'Fontdiner Swanky', cursive;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
