import './globals.css';
export const metadata = { title: 'E Social' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
