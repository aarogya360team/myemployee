import { AppShell } from "@/components/AppShell";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { requireBusiness } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/billing/catalog";
import { AddProductForm } from "@/components/AddProductForm";
import { CatalogueImport } from "@/components/CatalogueImport";
import { EmptyState, PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function ProductsPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  const products = await prisma.product.findMany({
    where: { businessId: ctx.businessId },
    include: { aliases: true },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title={`Teach ${ai.name} your products`}
        description={`${ai.name} will only quote prices from this list. No catalogue, no sale.`}
      />
      <AddProductForm />
      <div className="mt-4">
        <CatalogueImport />
      </div>
      {products.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No products yet" body="Add the SKUs your Delhi counter sells every day." />
        </div>
      ) : (
        <ul className="mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          {products.map((product, i) => (
            <li
              key={product.id}
              className={`flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm ${
                i > 0 ? "border-t border-[var(--line)]" : ""
              }`}
            >
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-[var(--muted)]">
                  {product.sku}
                  {product.aliases.length > 0 ? ` · Also: ${product.aliases.map((a) => a.alias).join(", ")}` : ""}
                </p>
              </div>
              <p className="font-medium">
                {formatInr(product.pricePaise)} · stock {product.stock}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
