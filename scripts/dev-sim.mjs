// npm run dev:sim — start the app with simulated TideCloak (Plan C, see src/lib/tideSim.tsx).
import { existsSync, writeFileSync } from "fs";
import { spawn } from "child_process";

// providers.tsx imports the adapter at build time; live setup writes it, simulation needs a placeholder.
const adapter = "data/tidecloak.json";
if (!existsSync(adapter)) writeFileSync(adapter, JSON.stringify({ simulated: true }, null, 2));

spawn("npx", ["next", "dev", "--webpack"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_TIDE_SIMULATED: "1" },
}).on("exit", (code) => process.exit(code ?? 0));
