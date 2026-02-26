#!/usr/bin/env node
/**
 * resync.js — Detecta el túnel activo y sincroniza todos los agentes de Retell.
 * 
 * Uso:
 *   node resync.js                  → Detecta de tunnel.txt automáticamente
 *   node resync.js <URL_TUNEL>      → Usa la URL proporcionada directamente
 * 
 * Ejemplo:
 *   node resync.js https://abc123.lhr.life
 */

const Retell = require('retell-sdk').default;
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
    return acc;
}, {});

const retell = new Retell({ apiKey: env.RETELL_API_KEY });

// ─── Helpers ─────────────────────────────────────────────────────────────────
function testUrl(tunnelUrl) {
    return new Promise((resolve) => {
        const payload = JSON.stringify({
            function_name: 'check_availability',
            args: { client_id: 'cmm0hcj6w000013wgcfyqalro', date: '2026-02-26' }
        });
        const url = new URL(`${tunnelUrl}/api/retell/function-call`);
        const lib = url.protocol === 'https:' ? https : http;
        const req = lib.request({
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length },
            timeout: 5000
        }, res => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode, body: body.slice(0, 100) }));
        });
        req.on('error', e => resolve({ ok: false, error: e.message }));
        req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'TIMEOUT' }); });
        req.write(payload);
        req.end();
    });
}

function updateEnvFile(newUrl) {
    const envPath = path.join(process.cwd(), '.env');
    let content = fs.readFileSync(envPath, 'utf8');
    content = content.replace(/^NEXT_PUBLIC_APP_URL=.*/m, `NEXT_PUBLIC_APP_URL=${newUrl}`);
    fs.writeFileSync(envPath, content, 'utf8');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    let tunnelUrl = process.argv[2];

    if (!tunnelUrl) {
        console.log('🔍 Detectando túnel activo desde tunnel.txt...');
        const tunnelLog = fs.readFileSync('tunnel.txt', 'utf8');
        const matches = [...tunnelLog.matchAll(/https:\/\/([a-f0-9]+\.lhr\.life)/g)];

        if (!matches.length) {
            console.error('❌ No se encontró ninguna URL en tunnel.txt.');
            console.error('   Pasa la URL manualmente: node resync.js https://TU_URL.lhr.life');
            process.exit(1);
        }

        // Try URLs from newest to oldest
        const urls = [...new Set(matches.map(m => m[0]))].reverse();
        console.log(`   Candidatas: ${urls.join(', ')}\n`);

        for (const url of urls) {
            process.stdout.write(`   Probando ${url}... `);
            const result = await testUrl(url);
            if (result.ok) {
                console.log('✅ ACTIVA');
                tunnelUrl = url;
                break;
            } else {
                console.log(`❌ (${result.error || result.status})`);
            }
        }

        if (!tunnelUrl) {
            console.error('\n❌ Ninguna URL funciona. El túnel no está activo.');
            console.error('   Inicia el túnel primero: ssh -R 80:localhost:3003 localhost.run >> tunnel.txt 2>&1 &');
            process.exit(1);
        }
    } else {
        // Validate provided URL
        process.stdout.write(`🔌 Verificando ${tunnelUrl}... `);
        const result = await testUrl(tunnelUrl);
        if (!result.ok) {
            console.log(`❌ No responde (${result.error || result.status})`);
            process.exit(1);
        }
        console.log('✅ OK');
    }

    const baseUrl = tunnelUrl.replace(/\/$/, '');
    const webhookUrl = `${baseUrl}/api/retell/webhook`;
    const toolsUrl = `${baseUrl}/api/retell/function-call`;

    console.log(`\n🚀 Sincronizando con:`);
    console.log(`   Base:    ${baseUrl}`);
    console.log(`   Webhook: ${webhookUrl}`);
    console.log(`   Tools:   ${toolsUrl}`);

    // Update .env
    updateEnvFile(baseUrl);
    console.log('\n✅ .env actualizado');

    // Sync all agents
    console.log('\n📡 Sincronizando agentes de Retell...');
    const agents = await retell.agent.list();

    for (const agent of agents) {
        process.stdout.write(`   ${agent.agent_name} (${agent.agent_id})... `);
        try {
            await retell.agent.update(agent.agent_id, { webhook_url: webhookUrl });

            const llmId = agent.response_engine?.llm_id;
            if (llmId) {
                try {
                    const llm = await retell.llm.retrieve(llmId);
                    const states = (llm.states || []).map(state => ({
                        ...state,
                        tools: (state.tools || []).map(tool =>
                            tool.type === 'custom' ? { ...tool, url: toolsUrl } : tool
                        )
                    }));
                    await retell.llm.update(llmId, { states });
                    console.log('✅');
                } catch (e) {
                    console.log(`⚠️  (LLM: ${e.message.slice(0, 60)})`);
                }
            } else {
                console.log('✅ (sin LLM estándar)');
            }
        } catch (e) {
            console.log(`❌ ${e.message.slice(0, 80)}`);
        }
    }

    console.log('\n🎉 Resync completado. El bot debería funcionar ahora.');
    console.log(`   Túnel activo: ${baseUrl}\n`);
}

main().catch(e => { console.error('Error fatal:', e.message); process.exit(1); });
