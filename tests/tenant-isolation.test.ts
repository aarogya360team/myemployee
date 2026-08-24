import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { getAiEmployee, serializeEmployee } from "../src/lib/ai-employee";
import { getBusinessForUser, updateAiEmployee } from "../src/lib/business";
import { isPluginEnabled, setPluginEnabled } from "../src/lib/platform/plugins";
import { resolveTenantContext } from "../src/lib/platform/tenant";
import { prisma } from "../src/lib/prisma";
import {
  createOwner,
  expectForbidden,
  onboardShop,
  resetDb,
} from "./helpers";

before(async () => {
  await resetDb();
});

after(async () => {
  await prisma.$disconnect();
});

test("two shop owners cannot read each other’s business or AI employee", async () => {
  const sharmaOwner = await createOwner("sharma@example.com", "Sharma");
  const guptaOwner = await createOwner("gupta@example.com", "Gupta");

  const sharma = await onboardShop(sharmaOwner.id, "Sharma Electricals", "Rahul");
  const gupta = await onboardShop(guptaOwner.id, "Gupta Paints", "Neha");

  const sharmaView = await getBusinessForUser(sharmaOwner.id, sharma.id);
  const guptaView = await getBusinessForUser(guptaOwner.id, gupta.id);
  assert.equal(sharmaView.name, "Sharma Electricals");
  assert.equal(guptaView.name, "Gupta Paints");
  assert.notEqual(sharmaView.id, guptaView.id);

  await expectForbidden(() => getBusinessForUser(sharmaOwner.id, gupta.id));
  await expectForbidden(() => getBusinessForUser(guptaOwner.id, sharma.id));

  const sharmaCtx = await resolveTenantContext(sharmaOwner.id, sharma.id);
  const guptaCtx = await resolveTenantContext(guptaOwner.id, gupta.id);
  await expectForbidden(() => resolveTenantContext(sharmaOwner.id, gupta.id));

  const rahul = await getAiEmployee(sharmaCtx);
  const neha = await getAiEmployee(guptaCtx);
  assert.equal(rahul?.name, "Rahul");
  assert.equal(neha?.name, "Neha");
  assert.equal(rahul?.businessId, sharma.id);
  assert.equal(neha?.businessId, gupta.id);
});

test("a shop cannot enable add-ons for another shop", async () => {
  const sharmaOwner = await prisma.user.findUniqueOrThrow({
    where: { email: "sharma@example.com" },
  });
  const guptaOwner = await prisma.user.findUniqueOrThrow({
    where: { email: "gupta@example.com" },
  });
  const sharma = await prisma.business.findFirstOrThrow({
    where: { name: "Sharma Electricals" },
  });
  const gupta = await prisma.business.findFirstOrThrow({
    where: { name: "Gupta Paints" },
  });

  const sharmaCtx = await resolveTenantContext(sharmaOwner.id, sharma.id);
  const guptaCtx = await resolveTenantContext(guptaOwner.id, gupta.id);

  await setPluginEnabled(sharmaCtx, "channel.whatsapp", true);
  assert.equal(await isPluginEnabled(sharmaCtx, "channel.whatsapp"), true);
  assert.equal(await isPluginEnabled(guptaCtx, "channel.whatsapp"), false);
});

test("updating Rahul does not change Neha", async () => {
  const sharmaOwner = await prisma.user.findUniqueOrThrow({
    where: { email: "sharma@example.com" },
  });
  const guptaOwner = await prisma.user.findUniqueOrThrow({
    where: { email: "gupta@example.com" },
  });
  const sharma = await prisma.business.findFirstOrThrow({
    where: { name: "Sharma Electricals" },
  });
  const gupta = await prisma.business.findFirstOrThrow({
    where: { name: "Gupta Paints" },
  });
  const sharmaCtx = await resolveTenantContext(sharmaOwner.id, sharma.id);
  const guptaCtx = await resolveTenantContext(guptaOwner.id, gupta.id);

  await updateAiEmployee(sharmaCtx, { name: "Rahul Ji", tone: "professional" });
  const rahul = serializeEmployee((await getAiEmployee(sharmaCtx))!);
  const neha = serializeEmployee((await getAiEmployee(guptaCtx))!);
  assert.equal(rahul.name, "Rahul Ji");
  assert.equal(rahul.tone, "professional");
  assert.equal(neha.name, "Neha");
  assert.equal(neha.tone, "friendly");
});
