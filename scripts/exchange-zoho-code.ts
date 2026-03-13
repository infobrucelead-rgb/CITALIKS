import { URLSearchParams } from "url";

/**
 * Script para intercambiar el Grant Code de Zoho por un Refresh Token
 * 
 * Uso: npx ts-node scripts/exchange-zoho-code.ts <CLIENT_ID> <CLIENT_SECRET> <GRANT_CODE> <REGION>
 * Ejemplo: npx ts-node scripts/exchange-zoho-code.ts 1000.XXX 4c15... XXX eu
 */

async function exchange() {
    const [clientId, clientSecret, code, region = "eu"] = process.argv.slice(2);

    if (!clientId || !clientSecret || !code) {
        console.error("Uso: npx ts-node scripts/exchange-zoho-code.ts <CLIENT_ID> <CLIENT_SECRET> <GRANT_CODE> [region]");
        process.exit(1);
    }

    const accountsUrl = `https://accounts.zoho.${region}/oauth/v2/token`;

    try {
        const params = new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
        });

        const res = await fetch(accountsUrl, {
            method: "POST",
            body: params
        });

        const data = await res.json();

        if (data.error) {
            console.error("\x1b[31mError de Zoho:\x1b[0m", data.error);
        } else {
            console.log("\x1b[32m--- EXITO ---\x1b[0m");
            console.log("Refresh Token:", data.refresh_token);
            console.log("Access Token:", data.access_token);
            console.log("\x1b[33mCopia el Refresh Token en el dashboard de CitaLiks.\x1b[0m");
        }
    } catch (err) {
        console.error("Error en la petición:", err);
    }
}

exchange();
