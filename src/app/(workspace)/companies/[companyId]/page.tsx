import { notFound } from "next/navigation";
import { getCompany } from "@/actions/companies";
import { CompanyDetail } from "@/components/companies/company-detail";

export default async function CompanyDetailPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const result = await getCompany(companyId);
  if (!result.success || !result.data) notFound();
  return <CompanyDetail company={result.data} />;
}
