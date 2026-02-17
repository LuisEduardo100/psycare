const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const patient = await prisma.patientProfile.findFirst({
        where: {
            user: {
                full_name: {
                    contains: 'Patient Zero',
                    mode: 'insensitive'
                }
            }
        },
        include: {
            user: true
        }
    });

    if (patient) {
        console.log(JSON.stringify({
            patient_id: patient.id,
            user_id: patient.user_id,
            doctor_id: patient.doctor_id,
            name: patient.user.full_name
        }, null, 2));
    } else {
        console.log('Patient Zero not found');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
