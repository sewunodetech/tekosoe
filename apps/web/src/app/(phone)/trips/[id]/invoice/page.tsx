import { redirect } from "next/navigation";

export const dynamicParams = false;
export const generateStaticParams = () => [{ id: "japan" }];

/** /trips/japan/invoice → invoice pertama (I1 Refunded). */
export default async function InvoiceIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/trips/${id}/invoice/jack`);
}
