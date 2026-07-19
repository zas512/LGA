import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const FIRM_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  const passwordHash = await bcrypt.hash("12345678", 10);
  await prisma.user.upsert({
    where: { email: "zain@lga.dev" },
    update: {},
    create: {
      email: "zain@lga.dev",
      passwordHash,
      role: "SUPER_ADMIN"
    }
  });
  const firm = await prisma.firm.upsert({
    where: { id: FIRM_ID },
    update: {},
    create: {
      id: FIRM_ID,
      name: "Laal Global Advisory"
    }
  });
  await prisma.user.upsert({
    where: { email: "hammad@laalglobal.com" },
    update: {},
    create: {
      email: "hammad@laalglobal.com",
      passwordHash,
      role: "OWNER",
      firmId: firm.id
    }
  });
  await prisma.user.upsert({
    where: { email: "admin@laalglobal.com" },
    update: {},
    create: {
      email: "admin@laalglobal.com",
      passwordHash,
      role: "ADMIN",
      firmId: firm.id
    }
  });
  await prisma.user.upsert({
    where: { email: "associate@laalglobal.com" },
    update: {},
    create: {
      email: "associate@laalglobal.com",
      passwordHash,
      role: "ASSOCIATE",
      firmId: firm.id
    }
  });
  console.log("Seed complete:");
  console.log(`  Firm: ${firm.name} (${firm.id})`);
  console.log("  superadmin@lga.dev / password123");
  console.log("  owner@laalglobal.com / password123");
  console.log("  admin@laalglobal.com / password123");
  console.log("  associate@laalglobal.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
