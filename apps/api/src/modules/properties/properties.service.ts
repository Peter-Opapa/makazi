import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: implement — see design_handoff_makazi_v1/10-implementation-notes.md
}
