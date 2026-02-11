import { getFiles } from "@/actions/files";
import { FilesView } from "@/components/files/files-view";

export const metadata = { title: "Files" };

export default async function FilesPage() {
  const result = await getFiles();
  const files = result.success ? result.data ?? [] : [];
  return <FilesView files={files} />;
}
