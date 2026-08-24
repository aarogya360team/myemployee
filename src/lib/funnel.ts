import { prisma } from "@/lib/prisma";

export async function trackFunnel(input: {
  name: string;
  businessId?: string | null;
  userId?: string | null;
}) {
  await prisma.funnelEvent.create({
    data: {
      name: input.name,
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
    },
  });
}
