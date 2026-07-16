import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { marketplaceRepository } from "@/lib/supabase/marketplace.repository";
import PrintButton from "@/components/marketplace/PrintButton";

export const dynamic = "force-dynamic";

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.accountType !== "agent" && profile?.accountType !== "owner") {
    redirect("/");
  }

  // Owner-scoped fetch — an agent can only see their own invoice.
  const purchase = await marketplaceRepository.getPurchaseForInvoice(
    user.id,
    Number(purchaseId)
  );
  if (!purchase) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/leads-marketplace"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Invoice</h1>
            <p className="mt-1 text-sm text-slate-500">
              {purchase.invoiceNo ?? `#${purchase.purchaseId}`}
            </p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <div className="font-semibold text-slate-800">
              All New Launches
            </div>
            <div>Leads Marketplace</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Billed to
            </div>
            <div className="mt-1 font-medium text-slate-800">
              {profile.fullName ?? "Agent"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Date
            </div>
            <div className="mt-1 text-slate-800">
              {fmtDate(purchase.purchasedAt)}
            </div>
          </div>
        </div>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3 text-slate-700">
                Buyer lead — {purchase.propertyTitle ?? "Property enquiry"}
                <div className="text-xs text-slate-400">
                  {[purchase.locality, purchase.city].filter(Boolean).join(", ")}
                </div>
              </td>
              <td className="py-3 text-right text-slate-800">
                {money(purchase.price)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 text-right font-semibold text-slate-900">
                Total
              </td>
              <td className="py-3 text-right font-bold text-slate-900">
                {money(purchase.price)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-6 text-xs text-slate-400">
          Paid via wallet credits. This is a computer-generated invoice.
        </p>
      </div>
    </div>
  );
}
