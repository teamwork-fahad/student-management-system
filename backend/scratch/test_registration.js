import prisma from "../src/config/prisma.js";

async function testSequences() {
  console.log("Checking Sequences in Neon DB...");
  const sequences = await prisma.sequence.findMany();
  console.log("Sequences in DB:", sequences);

  const admissionSeq = await prisma.sequence.findFirst({ where: { name: "ADMISSION" } });
  const studentSeq = await prisma.sequence.findFirst({ where: { name: "STUDENT" } });

  console.log("ADMISSION seq:", admissionSeq);
  console.log("STUDENT seq:", studentSeq);
}

testSequences().finally(() => prisma.$disconnect());
