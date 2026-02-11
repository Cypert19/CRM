import { notFound } from "next/navigation";
import { getDeal, getDealWithRelations } from "@/actions/deals";
import { DealDetail } from "@/components/deals/deal-detail";

export async function generateMetadata({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const result = await getDeal(dealId);
  return { title: result.success ? result.data?.title : "Deal" };
}

export default async function DealDetailPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const result = await getDealWithRelations(dealId);

  if (!result.success || !result.data) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <DealDetail deal={result.data as any} />;
}
