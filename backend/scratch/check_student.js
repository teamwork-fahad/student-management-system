import prisma from '../src/config/prisma.js';

async function check() {
  const email = 'hitarthbhathawala@gmail.com';
  console.log('Searching for email:', email);

  const users = await prisma.user.findMany({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: { student: true },
  });
  console.log('Users found:', users);

  const students = await prisma.student.findMany({
    where: {
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        { fullName: { contains: 'Hitarth', mode: 'insensitive' } },
      ]
    },
    include: { user: true, admission: true },
  });
  console.log('Students found:', students);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
