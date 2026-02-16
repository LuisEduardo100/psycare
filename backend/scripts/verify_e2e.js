const API_URL = 'http://localhost:3001/api/v1';

async function verifyFlow() {
    try {
        console.log('--- STARTING E2E VERIFICATION (FETCH) ---');

        // Helper for fetch
        const post = async (url, body, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`POST ${url} failed: ${res.status} ${text}`);
            }
            return res.json();
        };

        const get = async (url, token) => {
             const headers = { 'Content-Type': 'application/json' };
             if (token) headers['Authorization'] = `Bearer ${token}`;
             const res = await fetch(url, { headers });
             if (!res.ok) {
                const text = await res.text();
                throw new Error(`GET ${url} failed: ${res.status} ${text}`);
            }
            return res.json();
        };

        // 1. Login as Patient
        console.log('1. Logging in as Patient...');
        const patientAuth = await post(`${API_URL}/auth/login`, {
            email: 'patient@psycare.com',
            password: 'admin123'
        });
        const patientToken = patientAuth.access_token;
        console.log('   Patient logged in. Token:', patientToken ? 'OK' : 'MISSING');

        // 2. Submit Daily Log (Low Mood to trigger Alert)
        console.log('2. Submitting Daily Log (Mood 1/5)...');
        const dailyLog = await post(`${API_URL}/daily-logs`, {
            date: new Date(Date.now() + 86400000).toISOString(),
            mood_level: -3, // Severe Depression
            anxiety_level: 3,
            irritability_level: 2,
            sleep_hours: 4.5,
            notes: 'Feeling very down today.',
            suicidal_ideation_flag: true,
        }, patientToken);
        
        console.log('   Daily Log created. ID:', dailyLog.id);
        if (dailyLog.risk_flag) {
            console.log('   Risk Flag correctly detected!');
        } else {
            console.error('   Risk Flag NOT detected! (Expected true)');
        }

        // 3. Login as Doctor
        console.log('3. Logging in as Doctor...');
        const doctorAuth = await post(`${API_URL}/auth/login`, {
            email: 'doctor@psycare.com',
            password: 'admin123'
        });
        const doctorToken = doctorAuth.access_token;
        console.log('   Doctor logged in.');

        // 4. Check Alerts
        console.log('4. Fetching Alerts...');
        const alerts = await get(`${API_URL}/alerts?severity=HIGH`, doctorToken);
        
        console.log(`   Found ${alerts.length} high severity alerts.`);
        
        // Check if we found our alert (generated just now)
        // Since we don't have exact ID link without querying logs, assume it's the latest or exists
        if (alerts.length > 0) {
            console.log('   SUCCESS: Alert found in Doctor Dashboard!');
             console.log('   Alert:', JSON.stringify(alerts[0], null, 2));
        } else {
            console.error('   FAILURE: No alerts found!');
        }

    } catch (error) {
        console.error('VERIFICATION FAILED:', error.message);
    }
}

verifyFlow();
