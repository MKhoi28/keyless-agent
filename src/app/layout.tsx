import { Providers } from "./providers";

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
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "2rem", background: "#0a0a0a", color: "#ededed" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
