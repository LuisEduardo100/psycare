const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const models = Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'));
console.log('Total Models found:', models.length);
console.log('All Models:', models);
prisma.$disconnect();
