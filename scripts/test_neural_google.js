const https = require('https');

async function getAccessToken() {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

    const data = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN,
        grant_type: 'refresh_token',
    }).toString();

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'oauth2.googleapis.com',
            port: 443,
            path: '/token',
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => resolve(JSON.parse(body).access_token));
        });
        req.write(data);
        req.end();
    });
}

async function listCalendars(token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.googleapis.com',
            port: 443,
            path: '/calendar/v3/users/me/calendarList',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.end();
    });
}

async function run() {
    try {
        const token = await getAccessToken();
        console.log("Token obtained.");
        const list = await listCalendars(token);
        console.log("Calendar List:", JSON.stringify(list, null, 2));
    } catch (err) {
        console.error(err);
    }
}

run();
