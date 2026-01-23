const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('Total users:', users.length);
    users.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
