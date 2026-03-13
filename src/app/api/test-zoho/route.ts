import { NextRequest, NextResponse } from "next/server";
import { ZohoConnector } from "@/lib/crm";

export async function GET(req: NextRequest) {
    const config = {
        crmClientId: "1000.ZUBXAREG5T4TP3RJUZS8JY8VVWPI9I",
        crmClientSecret: "4c158e2de31fb99c5348dbd4f6371cf99498d41cb6",
        crmRefreshToken: "1000.896bc2096079e93ed8b8a32b1c418e37.7e2622e79e3550b434dee1bc96bdd4ff",
        crmUrl: "eu"
    };

    const crm = new ZohoConnector(config);

    try {
        console.log("--- Test Zoho API Route ---");
        const contact = await crm.createOrUpdateContact({
            name: "Test API Route",
            phone: "+34611111111",
            email: "api-test@citaliks.com"
        });

        if (contact) {
            await crm.logActivity({
                contactId: contact.id,
                type: "CALL",
                details: "Prueba desde API route de CitaLiks"
            });
            return NextResponse.json({ success: true, contactId: contact.id });
        }
        return NextResponse.json({ success: false, error: "Failed to create contact" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
