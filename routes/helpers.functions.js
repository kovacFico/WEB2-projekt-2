const db = require('../db');


async function alterPasswordVulnerability(vulnerability) {
    try {
        const password = vulnerability ? '12345678' : 'JAKA sifra bas moja 2024.';
        const sqlPass = `UPDATE users SET password = '` + password + `' WHERE user_id = 1`;
        const resultsqlPass = await db.query(sqlPass, []);
    } catch (error) {
        console.error(error);
    }
}

async function updateLoginAttemptsForIP(resultIPaddr, increment, clientIp, reset) {
    try {
        if (increment) {
            var newAttemptCount = resultIPaddr ? resultIPaddr.attempt_count + 1 : 1;
            const sqlPass = `UPDATE login_attempts SET attempt_count = $1, last_attempt = now()::timestamp WHERE ip_address = $2;`;
            const resultPass = await db.query(sqlPass, [newAttemptCount, clientIp]);
        }

        if (reset) {
            const sqlResetLoginAttempts = `UPDATE login_attempts SET attempt_count = 0 WHERE ip_address = $1;`;
            const resultResetLoginAttempts = await db.query(sqlResetLoginAttempts, [clientIp]);
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    alterPasswordVulnerability, updateLoginAttemptsForIP
};