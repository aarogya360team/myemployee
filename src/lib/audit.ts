import { prisma } from "./prisma";

type AuditInput = {
  businessId?: string | null;
  userId?: string | null;
  actorType: "USER" | "AI" | "SYSTEM";
  actorId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAudit(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      actorType: input.actorType,
      actorId: input.actorId ?? input.userId ?? null,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}
