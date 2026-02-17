const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
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

    const medications = await prisma.medication.findMany({ take: 5 });

    if (patient) {
        const data = {
            patient: {
                id: patient.id,
                user_id: patient.user_id,
                doctor_id: patient.doctor_id,
                name: patient.user.full_name
            },
            medications: medications.map(m => ({ id: m.id, name: m.name, form: m.form }))
        };
        fs.writeFileSync('scripts/patient-data.json', JSON.stringify(data, null, 2));
        console.log('Data saved to scripts/patient-data.json');
    } else {
        console.log('Patient Zero not found');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
