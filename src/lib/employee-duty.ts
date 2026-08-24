import { prisma } from "./prisma";

export async function resolveEmployeeDuty(employeeId: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return { muted: false as const, reply: null as string | null };

  if (employee.status === "PAUSED" && employee.pauseUntil && employee.pauseUntil <= new Date()) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: { status: "WORKING", pauseUntil: null },
    });
    return { muted: false as const, reply: null as string | null };
  }

  if (employee.status === "PAUSED") {
    return {
      muted: true as const,
      reply: `${employee.name} is on a short break. The owner will reply shortly.`,
    };
  }
  if (employee.status === "HUMAN_ONLY" || employee.status === "OFFLINE") {
    return {
      muted: true as const,
      reply: `The owner is handling customers right now. We'll get back to you.`,
    };
  }
  return { muted: false as const, reply: null as string | null };
}
