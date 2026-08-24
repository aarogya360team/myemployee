import assert from "node:assert/strict";
import { hashPassword } from "../src/lib/password";
import { createBusinessForOwner } from "../src/lib/business";
import { prisma } from "../src/lib/prisma";
import { HttpError } from "../src/lib/tenant";

export const defaultHours = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  openTime: "09:00",
  closeTime: "19:00",
  closed: dayOfWeek === 0,
}));

export async function resetDb() {
  await prisma.customerMemoryFact.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.recoveryOpportunity.deleteMany();
  await prisma.caseStudyApproval.deleteMany();
  await prisma.businessRule.deleteMany();
  await prisma.message.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.shopPayment.deleteMany();
  await prisma.shopInvoice.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productAlias.deleteMany();
  await prisma.product.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.customerAddress.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.businessFeature.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.businessSettings.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.usageCounter.deleteMany();
  await prisma.addonSubscription.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.businessMembership.deleteMany();
  await prisma.session.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();
}

export async function createOwner(email: string, name: string) {
  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword("password12"),
    },
  });
}

export async function onboardShop(
  userId: string,
  shopName: string,
  employeeName: string,
) {
  return createBusinessForOwner(userId, {
    name: shopName,
    category: "hardware_electrical",
    city: "Delhi",
    address: "Tilak Nagar, New Delhi",
    phone: "9876543210",
    timezone: "Asia/Kolkata",
    defaultLanguage: "hinglish",
    languages: ["hi", "en", "hinglish"],
    hours: defaultHours,
    aiEmployeeName: employeeName,
    aiTone: "friendly",
  });
}

export async function expectForbidden(fn: () => Promise<unknown>) {
  await assert.rejects(fn, (error: unknown) => {
    assert.ok(error instanceof HttpError);
    assert.equal(error.status, 403);
    return true;
  });
}
