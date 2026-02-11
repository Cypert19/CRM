import { getCompanies } from "@/actions/companies";
import { CompanyList } from "@/components/companies/company-list";

export const metadata = { title: "Companies" };

export default async function CompaniesPage() {
  const result = await getCompanies();
  const companies = result.success ? result.data ?? [] : [];
  return <CompanyList companies={companies} />;
}
