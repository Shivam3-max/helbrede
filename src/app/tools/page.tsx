import type { Metadata } from "next";
import Calculators from "./Calculators";

export const metadata: Metadata = {
  title: "Trade Calculators — PTR, Margin, Scheme, GST, ROI",
};

export default function ToolsPage() {
  return <Calculators />;
}
