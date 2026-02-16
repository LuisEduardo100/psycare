const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { id: 'desc' },
  });
  
  let output = '--- DATABASE USERS ---\n';
  for (const u of users) {
    output += `Email: [${u.email}] | Role: [${u.role}] | Name: [${u.full_name}]\n`;
  }
  output += '--- END OF LIST ---\n';
  
  const targetEmail = 'john@gmail.com';
  const john = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (john) {
    output += `Found ${targetEmail}: Role=${john.role}\n`;
  } else {
    output += `${targetEmail} NOT FOUND\n`;
  }

  const admin = await prisma.user.findUnique({ where: { email: 'admin@psycare.com' } });
  if (admin) {
    output += `Found admin@psycare.com: Role=${admin.role}\n`;
  }
  
  fs.writeFileSync('db-status.txt', output);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
