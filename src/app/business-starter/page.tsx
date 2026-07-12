import type { Metadata } from "next";
import Starter from "./Starter";

export const metadata: Metadata = {
  title: "Start Your Pharma Business — Guided Setup",
};

export default function BusinessStarterPage() {
  return <Starter />;
}
