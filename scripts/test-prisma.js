const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter });
    await prisma.$connect();

    console.log('terms type:', typeof prisma.terms);
    console.log('admin type:', typeof prisma.admin);

    const tables = await prisma.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    console.log('tables:', tables);

    await prisma.$disconnect();
}

main().catch(console.error);
