import { getContacts } from "@/actions/contacts";
import { ContactsList } from "@/components/contacts/contact-list";

export const metadata = { title: "Contacts" };

export default async function ContactsPage() {
  const result = await getContacts();
  const contacts = result.success ? result.data ?? [] : [];
  return <ContactsList contacts={contacts} />;
}
