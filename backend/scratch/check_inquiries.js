import prisma from '../src/config/prisma.js';

async function main() {
  const inqs = await prisma.inquiry.findMany({
    where: {
      fullName: { contains: 'Ishan', mode: 'insensitive' }
    },
    include: {
      course: true
    }
  });

  console.log('Remaining Inquiries for Ishan:');
  inqs.forEach(i => {
    console.log(`- InqID: ${i.id} | InqNo: ${i.inquiryNumber} | Name: ${i.fullName} | Course: ${i.course?.name} | Status: ${i.status}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
