
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching all therapeutic plans...');
    const plans = await prisma.therapeuticPlan.findMany({
        include: {
            patient: {
                include: {
                    user: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    console.log(`Found ${plans.length} plans.`);

    for (const plan of plans) {
        console.log('--------------------------------------------------');
        console.log(`Plan ID: ${plan.id}`);
        console.log(`Patient: ${plan.patient.user.full_name} (${plan.patient.user.email})`);
        console.log(`Created By (Doctor ID): ${plan.created_by}`);
        console.log(`Created At: ${plan.created_at}`);
        console.log(`Deleted At: ${plan.deleted_at}`);
        console.log(`Short Term Goals (Raw): ${plan.short_term_goals}`);

        try {
            const parsed = JSON.parse(plan.short_term_goals || '[]');
            console.log(`Short Term Goals (Parsed):`, parsed);
        } catch (e) {
            console.log(`Failed to parse short_term_goals:`, e.message);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
