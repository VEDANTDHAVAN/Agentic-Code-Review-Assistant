import { redirect } from "next/navigation";

export default async function ReviewJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  redirect(`/pull-requests?job=${jobId}`);
}
