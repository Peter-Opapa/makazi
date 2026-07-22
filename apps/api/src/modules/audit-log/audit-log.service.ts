import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";

export interface RecordAuditEntryInput {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Real, permanent audit trail — inject this into any module whose actions
 * must be recorded (suspend/reactivate user, retry payment callback, resolve
 * ticket, etc.). Every mutating Admin Portal action needs an entry here.
 * See 07-interaction-spec.md "Per-Module Notes" and 10-implementation-notes.md.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: RecordAuditEntryInput) {
    return this.prisma.auditLogEntry.create({ data: input });
  }

  findAll() {
    return this.prisma.auditLogEntry.findMany({ orderBy: { createdAt: "desc" } });
  }
}
