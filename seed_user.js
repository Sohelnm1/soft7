import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Try to delete user 1 first if exists to be clean, or just upsert with id: 1
    try {
        await prisma.user.delete({ where: { id: 1 } }).catch(() => { });
        await prisma.user.delete({ where: { email: 'admin@example.com' } }).catch(() => { });
    } catch (e) { }

    const user = await prisma.user.create({
        data: {
            id: 1, // Force ID 1
            name: 'Admin',
            email: 'admin@example.com',
            password: 'scrypt_hashed_password',
            role: 'ADMIN',
        },
    });
    console.log('User 1 ENSURED:', user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
