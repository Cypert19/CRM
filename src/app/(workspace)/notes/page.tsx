import { getNotes } from "@/actions/notes";
import { NotesList } from "@/components/notes/notes-list";

export const metadata = { title: "Notes" };

export default async function NotesPage() {
  const result = await getNotes();
  const notes = result.success ? result.data ?? [] : [];
  return <NotesList notes={notes} />;
}
