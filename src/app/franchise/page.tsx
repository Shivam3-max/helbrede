import type { Metadata } from "next";
import Franchise from "./Franchise";

export const metadata: Metadata = {
  title: "Monopoly Franchise Territories",
};

export default function FranchisePage() {
  return <Franchise />;
}
