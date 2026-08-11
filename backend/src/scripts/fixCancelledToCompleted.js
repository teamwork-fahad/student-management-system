import prisma from "../config/prisma.js";

const targetAdmissions = [
  "ADM-2025-068",
  "ADM-2025-072",
  "ADM-2025-069",
  "ADM-2025-071",
  "ADM-2025-070",
  "ADM-2025-066",
  "ADM-2025-067",
];

async function main() {
  console.log("=== Updating 7 Admissions to COMPLETED with 0 Dues ===");

  for (const admNum of targetAdmissions) {
    const adm = await prisma.admission.findFirst({
      where: { admissionNumber: admNum },
      include: { student: true },
    });

    if (!adm) {
      console.log(`❌ Admission not found: ${admNum}`);
      continue;
    }

    console.log(`\nBefore update for ${admNum}:`);
    console.log(`  Student: ${adm.student?.fullName || "N/A"}`);
    console.log(`  Status: ${adm.status}, DeletedAt: ${adm.deletedAt}`);
    console.log(
      `  CourseFees: ${adm.courseFees}, Paid: ${adm.paidAmount}, Pending: ${adm.pendingAmount}, Discount: ${adm.discount}`
    );

    const paid = Number(adm.paidAmount || 0);
    const courseF = Number(adm.courseFees || 0);

    // Make pendingAmount = 0.
    // If paid > 0, set finalFees = paidAmount, discount = courseFees - paidAmount.
    // If paid == 0, set discount = courseFees, finalFees = 0, pendingAmount = 0.
    const newFinalFees = paid;
    const newDiscount = Math.max(0, courseF - paid);
    const newPendingAmount = 0;

    const updatedAdm = await prisma.admission.update({
      where: { id: adm.id },
      data: {
        status: "COMPLETED",
        deletedAt: null,
        discount: newDiscount,
        finalFees: newFinalFees,
        pendingAmount: newPendingAmount,
      },
    });

    // Update associated Student record as well
    if (adm.student) {
      await prisma.student.update({
        where: { id: adm.student.id },
        data: {
          status: "COMPLETED",
          completionDate: new Date(),
          deletedAt: null,
        },
      });
    }

    console.log(`✅ Updated ${admNum}:`);
    console.log(`  New Status: COMPLETED, DeletedAt: null`);
    console.log(
      `  New FinalFees: ${updatedAdm.finalFees}, Discount: ${updatedAdm.discount}, Paid: ${updatedAdm.paidAmount}, Pending: ${updatedAdm.pendingAmount}`
    );
  }

  await prisma.$disconnect();
  console.log("\n🎉 All 7 records updated successfully!");
}

main().catch((err) => {
  console.error("Error updating admissions:", err);
  prisma.$disconnect();
  process.exit(1);
});
