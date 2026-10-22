"use client";

import { TideCloakProvider } from "@tidecloak/nextjs";
import tcConfig from "../../data/tidecloak.json";
import { SimTideProvider } from "@/lib/tideSim";
import { SIMULATED } from "@/lib/tide";

// The provider takes the adapter JSON directly as the config prop.
// useDPoP goes inside the config object, not as a separate JSX prop (I-12).
export function Providers({ children }: { children: React.ReactNode }) {
  if (SIMULATED) return <SimTideProvider>{children}</SimTideProvider>;
  return (
    <TideCloakProvider
      config={{ ...tcConfig, useDPoP: { mode: "strict", alg: "ES256" } }}
    >
      {children}
    </TideCloakProvider>
  );
}
