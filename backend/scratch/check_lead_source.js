import prisma from '../src/config/prisma.js';

async function checkLeadSources() {
  const ls = await prisma.leadSource.findMany();
  console.log('Lead sources:', ls);

  const defaultLs = await prisma.leadSource.findFirst();
  console.log('First lead source:', defaultLs);

  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  console.log('First Super Admin:', admin);
}

checkLeadSources()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
