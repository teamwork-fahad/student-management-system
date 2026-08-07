import prisma from '../src/config/prisma.js';

async function deleteFlaskInquiries() {
  const inqIds = ['cmshh58680001v37wkem1tbis', 'cmshhg9x40002v3yg3k4u570t', 'cmshhhigo0001v3lcyb7kbl19'];

  const result = await prisma.$transaction(async (tx) => {
    const followUps = await tx.inquiryFollowUp.deleteMany({
      where: { inquiryId: { in: inqIds } }
    });

    const inquiries = await tx.inquiry.deleteMany({
      where: { id: { in: inqIds } }
    });

    return {
      deletedFollowUps: followUps.count,
      deletedInquiries: inquiries.count
    };
  });

  console.log('✅ Deleted Flask Python Inquiries:', result);
}

deleteFlaskInquiries()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
