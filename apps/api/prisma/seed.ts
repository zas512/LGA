import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const FIRM_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  const passwordHash = await bcrypt.hash("12345678", 10);

  // 1. Create Super Admin (Platform scope)
  await prisma.user.upsert({
    where: { email: "zain@lga.dev" },
    update: {},
    create: {
      email: "zain@lga.dev",
      passwordHash,
      role: "SUPER_ADMIN"
    }
  });

  // 2. Create Firm
  const firm = await prisma.firm.upsert({
    where: { id: FIRM_ID },
    update: {},
    create: {
      id: FIRM_ID,
      name: "Laal Global Advisory"
    }
  });

  // 3. Create HR Associates if not present
  let hammadAssoc = await prisma.associate.findFirst({
    where: { email: "hammad@laalglobal.com", firmId: firm.id }
  });
  if (!hammadAssoc) {
    hammadAssoc = await prisma.associate.create({
      data: {
        firmId: firm.id,
        fullName: "Hammad Khan",
        email: "hammad@laalglobal.com",
        joiningDate: new Date("2024-01-01"),
        salary: 180000.0,
        status: "ACTIVE",
        designation: "Managing Partner"
      }
    });
  }

  let adminAssoc = await prisma.associate.findFirst({
    where: { email: "admin@laalglobal.com", firmId: firm.id }
  });
  if (!adminAssoc) {
    adminAssoc = await prisma.associate.create({
      data: {
        firmId: firm.id,
        fullName: "Admin Officer",
        email: "admin@laalglobal.com",
        joiningDate: new Date("2024-06-01"),
        salary: 100000.0,
        status: "ACTIVE",
        designation: "Administrator"
      }
    });
  }

  let associateAssoc = await prisma.associate.findFirst({
    where: { email: "associate@laalglobal.com", firmId: firm.id }
  });
  if (!associateAssoc) {
    associateAssoc = await prisma.associate.create({
      data: {
        firmId: firm.id,
        fullName: "Ali Associate",
        email: "associate@laalglobal.com",
        joiningDate: new Date("2025-01-15"),
        salary: 80000.0,
        status: "ACTIVE",
        designation: "Senior Associate"
      }
    });
  }

  // 4. Create User Accounts linked to their HR profile
  const hammadUser = await prisma.user.upsert({
    where: { email: "hammad@laalglobal.com" },
    update: { associateId: hammadAssoc.id },
    create: {
      email: "hammad@laalglobal.com",
      passwordHash,
      role: "OWNER",
      firmId: firm.id,
      associateId: hammadAssoc.id
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@laalglobal.com" },
    update: { associateId: adminAssoc.id },
    create: {
      email: "admin@laalglobal.com",
      passwordHash,
      role: "ADMIN",
      firmId: firm.id,
      associateId: adminAssoc.id
    }
  });

  // 5. Seed Lookup Data: Court Stages (CPC & CrPC Pakistan legal system)
  const stagesToSeed = [
    {
      name: "Institution of Suit (Plaint filing / Dawa)",
      sequenceOrder: 1,
      caseType: "CIVIL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Summons / Service (Talbana / Summoning)",
      sequenceOrder: 2,
      caseType: "CIVIL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Written Statement (Jawab Dawa)",
      sequenceOrder: 3,
      caseType: "CIVIL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Framing of Issues (Tanqeehat)",
      sequenceOrder: 4,
      caseType: "CIVIL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Plaintiff's Evidence (Shahadat Madai)",
      sequenceOrder: 5,
      caseType: "CIVIL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Defendant's Evidence (Shahadat Mudaa Alaih)",
      sequenceOrder: 6,
      caseType: "CIVIL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Final Arguments (Behas)",
      sequenceOrder: 7,
      caseType: "CIVIL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Judgment / Decree (Faisla)",
      sequenceOrder: 8,
      caseType: "CIVIL" as const,
      isDefault: true,
      firmId: null
    },

    {
      name: "Registration of FIR / Complaint",
      sequenceOrder: 1,
      caseType: "CRIMINAL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Inquiry / Investigation",
      sequenceOrder: 2,
      caseType: "CRIMINAL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Framing of Charge (Fard-e-Jurm)",
      sequenceOrder: 3,
      caseType: "CRIMINAL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Prosecution Evidence",
      sequenceOrder: 4,
      caseType: "CRIMINAL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Statement of Accused (342 CrPC)",
      sequenceOrder: 5,
      caseType: "CRIMINAL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Defense Evidence",
      sequenceOrder: 6,
      caseType: "CRIMINAL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Final Arguments (Behas)",
      sequenceOrder: 7,
      caseType: "CRIMINAL" as const,
      isDefault: true,
      firmId: null
    },
    {
      name: "Judgment / Sentencing",
      sequenceOrder: 8,
      caseType: "CRIMINAL" as const,
      isDefault: true,
      firmId: null
    }
  ];

  for (const s of stagesToSeed) {
    const existing = await prisma.courtStage.findFirst({
      where: { name: s.name, caseType: s.caseType, firmId: null }
    });
    if (!existing) {
      await prisma.courtStage.create({ data: s });
    }
  }

  // 6. Seed Sample Cases / Matters
  const civilWrittenStatementStage = await prisma.courtStage.findFirst({
    where: { name: "Written Statement (Jawab Dawa)", caseType: "CIVIL" }
  });
  const criminalFilingStage = await prisma.courtStage.findFirst({
    where: { name: "Registration of FIR / Complaint", caseType: "CRIMINAL" }
  });

  let matter1 = await prisma.matter.findFirst({
    where: { firmCaseNumber: "LGA-2026-CV-01", firmId: firm.id }
  });
  if (!matter1) {
    matter1 = await prisma.matter.create({
      data: {
        firmId: firm.id,
        firmCaseNumber: "LGA-2026-CV-01",
        courtCaseNumber: "Civil Suit No. 452/2025",
        cnr: "PB01002345672025",
        caseType: "CIVIL",
        court: "Civil Court, Lahore",
        bench: "Civil Bench Class-I",
        presidingJudge: "Mr. Muhammad Jahangir, Civil Judge Class-I",
        currentStageId: civilWrittenStatementStage?.id ?? null,
        status: "ACTIVE",
        filingDate: new Date("2025-11-10"),
        clientName: "M/S Pakistan Trade House"
      }
    });
  }

  let matter2 = await prisma.matter.findFirst({
    where: { firmCaseNumber: "LGA-2026-CR-02", firmId: firm.id }
  });
  if (!matter2) {
    matter2 = await prisma.matter.create({
      data: {
        firmId: firm.id,
        firmCaseNumber: "LGA-2026-CR-02",
        courtCaseNumber: "FIR No. 234/2026",
        cnr: "ISB0200348272026",
        caseType: "CRIMINAL",
        court: "Sessions Court, Islamabad",
        bench: "Sessions Court West",
        presidingJudge: "Mr. Tariq Mehmood, Additional Sessions Judge",
        currentStageId: criminalFilingStage?.id ?? null,
        status: "ACTIVE",
        filingDate: new Date("2026-05-02"),
        clientName: "Muhammad Kamran"
      }
    });
  }

  // Assign Associates to Matters
  await prisma.matterAssociate.upsert({
    where: {
      matterId_associateId: {
        matterId: matter1.id,
        associateId: hammadAssoc.id
      }
    },
    update: {},
    create: {
      matterId: matter1.id,
      associateId: hammadAssoc.id,
      role: "Lead Counsel"
    }
  });

  await prisma.matterAssociate.upsert({
    where: {
      matterId_associateId: {
        matterId: matter1.id,
        associateId: associateAssoc.id
      }
    },
    update: {},
    create: {
      matterId: matter1.id,
      associateId: associateAssoc.id,
      role: "Associate"
    }
  });

  await prisma.matterAssociate.upsert({
    where: {
      matterId_associateId: {
        matterId: matter2.id,
        associateId: associateAssoc.id
      }
    },
    update: {},
    create: {
      matterId: matter2.id,
      associateId: associateAssoc.id,
      role: "Lead Associate"
    }
  });

  // 7. Seed Sample Hearings
  // Past logged outcome hearing for Matter 1
  const existingHearing1 = await prisma.hearing.findFirst({
    where: {
      matterId: matter1.id,
      purpose: "Written Statement / Jawab Dawa filing"
    }
  });
  if (!existingHearing1) {
    await prisma.hearing.create({
      data: {
        matterId: matter1.id,
        hearingDate: new Date("2026-07-15T09:00:00.000Z"),
        purpose: "Written Statement / Jawab Dawa filing",
        presidingJudge: "Mr. Muhammad Jahangir",
        proceedingsSummary:
          "Written statement filed successfully. Issues to be framed on the next date.",
        status: "HELD",
        createdById: hammadUser.id,
        nextDate: new Date("2026-08-15T09:00:00.000Z"),
        nextPurpose: "Framing of Issues (Tanqeehat)"
      }
    });
  }

  // Future scheduled hearing for Matter 1
  const existingHearing2 = await prisma.hearing.findFirst({
    where: { matterId: matter1.id, purpose: "Framing of Issues (Tanqeehat)" }
  });
  if (!existingHearing2) {
    await prisma.hearing.create({
      data: {
        matterId: matter1.id,
        hearingDate: new Date("2026-08-15T09:00:00.000Z"),
        purpose: "Framing of Issues (Tanqeehat)",
        status: "SCHEDULED",
        createdById: hammadUser.id
      }
    });
  }

  // Future scheduled hearing for Matter 2
  const existingHearing3 = await prisma.hearing.findFirst({
    where: { matterId: matter2.id, purpose: "Arguments on Bail Application" }
  });
  if (!existingHearing3) {
    await prisma.hearing.create({
      data: {
        matterId: matter2.id,
        hearingDate: new Date("2026-08-20T09:00:00.000Z"),
        purpose: "Arguments on Bail Application",
        status: "SCHEDULED",
        createdById: adminUser.id
      }
    });
  }

  // 8. Seed Sample Tasks
  // Matter 1 Task (Pending)
  const existingTask1 = await prisma.task.findFirst({
    where: { matterId: matter1.id, title: "Draft proposed issues for framing" }
  });
  if (!existingTask1) {
    await prisma.task.create({
      data: {
        firmId: firm.id,
        matterId: matter1.id,
        createdById: hammadAssoc.id,
        title: "Draft proposed issues for framing",
        assignees: {
          create: [{ associateId: associateAssoc.id }]
        },
        description:
          "Analyze written statements and plaints to extract the key legal issues to propose on 2026-08-15.",
        taskType: "LEGAL_RESEARCH",
        status: "PENDING",
        priority: "HIGH",
        dueDate: new Date("2026-08-10T17:00:00.000Z")
      }
    });
  }

  // Matter 2 Task (Completed)
  const existingTask2 = await prisma.task.findFirst({
    where: { matterId: matter2.id, title: "Retrieve certified copy of FIR" }
  });
  if (!existingTask2) {
    await prisma.task.create({
      data: {
        firmId: firm.id,
        matterId: matter2.id,
        createdById: adminAssoc.id,
        title: "Retrieve certified copy of FIR",
        assignees: {
          create: [{ associateId: associateAssoc.id }]
        },
        description:
          "Obtain the certified copy of FIR 234/2026 from the police clerk.",
        taskType: "DOCUMENT_FILING",
        status: "COMPLETED",
        priority: "MEDIUM",
        dueDate: new Date("2026-07-28T17:00:00.000Z"),
        completionNotes:
          "Retrieved the certified copy and uploaded to the file repository."
      }
    });
  }

  console.log("Seed complete:");
  console.log(`  Firm: ${firm.name} (${firm.id})`);
  console.log("  superadmin@lga.dev / password123");
  console.log("  owner@laalglobal.com / password123");
  console.log("  admin@laalglobal.com / password123");
  console.log("  associate@laalglobal.com / password123");
  console.log("  Cases Seeded: LGA-2026-CV-01, LGA-2026-CR-02");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
