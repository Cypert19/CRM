import type { Metadata } from "next";
import { ImportView } from "@/components/import/import-view";

export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Import Data",
};

export default function ImportPage() {
  return <ImportView />;
}
