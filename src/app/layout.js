import "./globals.css";

export const metadata = {
  title: "RideShare - Smart Ride Sharing Platform",
  description: "Book rides instantly with the smartest ride-sharing platform. Choose from bikes, autos, cars, and premium vehicles.",
  keywords: "ride sharing, cab booking, bike ride, car ride, auto ride",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
