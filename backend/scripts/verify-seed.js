const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PATIENT_ID = 'ef9e21e9-4a72-417a-97a5-060dfdab8368';

async function main() {
    console.log('Verifying data for Patient Zero...');

    const logsCount = await prisma.dailyLog.count({ where: { patient_id: PATIENT_ID } });
    console.log(`Daily Logs count: ${logsCount}`);

    const prescriptions = await prisma.prescription.findMany({ where: { patient_id: PATIENT_ID } });
    console.log(`Active Prescriptions: ${prescriptions.length}`);
    prescriptions.forEach(p => console.log(`- ${p.dosage} ${p.frequency} (${p.is_active ? 'Ativa' : 'Inativa'})`));

    const plan = await prisma.therapeuticPlan.findFirst({
        where: { patient_id: PATIENT_ID }
    });
    if (plan) {
        const short = JSON.parse(plan.short_term_goals || '[]');
        const medium = JSON.parse(plan.medium_term_goals || '[]');
        console.log(`Therapeutic Plan found. Short-term goals: ${short.length}, Medium-term: ${medium.length}`);
    } else {
        console.log('No Therapeutic Plan found.');
    }

    const alerts = await prisma.alert.findMany({ where: { patient_id: PATIENT_ID } });
    console.log(`Alerts: ${alerts.length}`);
    alerts.forEach(a => console.log(`- ${a.severity} (${a.trigger_source})`));

    const consultations = await prisma.consultation.count({ where: { patient_id: PATIENT_ID } });
    console.log(`Consultations: ${consultations}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
