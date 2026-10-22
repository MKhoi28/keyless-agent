import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "Keyless Agent",
  description: "A clinic AI assistant that can never take patient data out on its own",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
