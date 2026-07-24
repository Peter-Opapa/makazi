import "dotenv/config";
import { randomBytes } from "crypto";
import * as bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";
import { AdminSubRole, UserRole } from "@makazi/shared-types";

const SALT_ROUNDS = 10;

/**
 * Bootstraps the very first Super Admin account. Admins have no self-registration
 * path (AuthService.requestRegistrationOtp rejects role=ADMIN by design) and
 * AdminRolesService.createStaff requires an existing Super Admin to call it —
 * so a brand-new deployment needs exactly this one seed to get off the ground.
 * Idempotent: does nothing if a Super Admin already exists.
 */
async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const existing = await prisma.user.findFirst({ where: { role: UserRole.ADMIN, adminSubRole: AdminSubRole.SUPER_ADMIN } });
    if (existing) {
      console.log(`A Super Admin already exists (${existing.email}) — skipping seed.`);
      return;
    }

    const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@makazi.co.ke";
    const firstName = process.env.SEED_SUPER_ADMIN_FIRST_NAME ?? "Super";
    const lastName = process.env.SEED_SUPER_ADMIN_LAST_NAME ?? "Admin";
    const tempPassword = randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role: UserRole.ADMIN,
        adminSubRole: AdminSubRole.SUPER_ADMIN,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    console.log("Seeded first Super Admin:");
    console.log(`  email:    ${user.email}`);
    console.log(`  password: ${tempPassword}`);
    console.log("Relay these to the operator directly — they are not shown again. Use Forgot Password to set a real one.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
