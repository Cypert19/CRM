import { notFound } from "next/navigation";
import { getContact } from "@/actions/contacts";
import { ContactDetail } from "@/components/contacts/contact-detail";

export default async function ContactDetailPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  const result = await getContact(contactId);
  if (!result.success || !result.data) notFound();
  return <ContactDetail contact={result.data} />;
}
