"use client";

import { useTideCloak as useLiveTide } from "@tidecloak/nextjs";
import { useSimTide } from "./tideSim";

export const SIMULATED = process.env.NEXT_PUBLIC_TIDE_SIMULATED === "1";

// Pages call this instead of useTideCloak, so one setting switches between live and simulated Tide.
export const useTide = SIMULATED ? useSimTide : useLiveTide;
