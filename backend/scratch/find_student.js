import prisma from '../src/config/prisma.js';

async function main() {
  console.log('--- Search by Student ID STD260121 ---');
  const byId = await prisma.student.findMany({
    where: {
      OR: [
        { studentId: { contains: 'STD260121', mode: 'insensitive' } },
        { studentId: { contains: '260121', mode: 'insensitive' } }
      ]
    },
    include: {
      admission: {
        include: {
          payments: true,
          course: true,
          inquiry: true
        }
      },
      user: true,
      documents: true,
      attendances: true
    }
  });
  console.log('Result by ID:', JSON.stringify(byId, null, 2));

  console.log('--- Search by Name Ishan ---');
  const byName = await prisma.student.findMany({
    where: {
      fullName: { contains: 'Ishan', mode: 'insensitive' }
    },
    include: {
      admission: {
        include: {
          payments: true,
          course: true,
          inquiry: true
        }
      },
      user: true,
      documents: true,
      attendances: true
    }
  });
  console.log('Result by Name Ishan:', JSON.stringify(byName, null, 2));

  console.log('--- Search by Name Patel ---');
  const byPatel = await prisma.student.findMany({
    where: {
      fullName: { contains: 'Patel', mode: 'insensitive' }
    },
    include: {
      admission: {
        include: {
          payments: true,
          course: true,
          inquiry: true
        }
      },
      user: true,
      documents: true,
      attendances: true
    }
  });
  console.log('Result by Name Patel:', JSON.stringify(byPatel, null, 2));

  console.log('--- Search Inquiries by Name Ishan ---');
  const inqIshan = await prisma.inquiry.findMany({
    where: {
      fullName: { contains: 'Ishan', mode: 'insensitive' }
    }
  });
  console.log('Inquiries by Name Ishan:', JSON.stringify(inqIshan, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
