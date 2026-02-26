
const fs = require('fs');
try {
    const log = fs.readFileSync('retell_debug.log', 'utf8');
    console.log(log);
} catch (e) {
    console.log('No log or error:', e.message);
}
