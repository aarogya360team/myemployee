import { prisma } from "./prisma";

export async function setActiveBusinessForUser(userId: string, businessId: string) {
  await prisma.session.updateMany({
    where: { userId },
    data: { activeBusinessId: businessId },
  });
}
