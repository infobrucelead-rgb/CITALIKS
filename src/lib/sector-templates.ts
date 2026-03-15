export type TemplateService = {
    name: string;
    durationMin: number;
    price?: number;
    description?: string;
    defaultActive: boolean;
};

export type SectorTemplate = {
    id: string;
    sector: string;
    services: TemplateService[];
    botLogic?: string;
};

export const SECTOR_TEMPLATES: SectorTemplate[] = [
    {
        id: "peluqueria",
        sector: "Peluquería / Barbería",
        services: [
            { name: "Corte de pelo", durationMin: 30, defaultActive: true },
            { name: "Corte + barba", durationMin: 45, defaultActive: true },
            { name: "Afeitado", durationMin: 20, defaultActive: true },
            { name: "Tinte", durationMin: 90, defaultActive: false },
            { name: "Mechas", durationMin: 120, defaultActive: false },
            { name: "Tratamiento capilar", durationMin: 45, defaultActive: false },
            { name: "Peinado", durationMin: 30, defaultActive: true },
        ]
    },
    {
        id: "estetica",
        sector: "Centro de estética / Spa",
        services: [
            { name: "Limpieza facial", durationMin: 60, defaultActive: true },
            { name: "Tratamiento facial", durationMin: 60, defaultActive: true },
            { name: "Depilación", durationMin: 30, defaultActive: true },
            { name: "Manicura", durationMin: 45, defaultActive: true },
            { name: "Pedicura", durationMin: 60, defaultActive: true },
            { name: "Masaje relajante", durationMin: 60, defaultActive: false },
            { name: "Masaje terapéutico", durationMin: 60, defaultActive: false },
        ]
    },
    {
        id: "medico",
        sector: "Clínica / Médico",
        services: [
            { name: "Consulta general", durationMin: 20, defaultActive: true },
            { name: "Primera visita", durationMin: 40, defaultActive: true },
            { name: "Revisión", durationMin: 20, defaultActive: true },
            { name: "Control de tratamiento", durationMin: 15, defaultActive: false },
            { name: "Consulta online", durationMin: 20, defaultActive: false },
        ]
    },
    {
        id: "dentista",
        sector: "Dentista",
        services: [
            { name: "Primera visita", durationMin: 30, defaultActive: true },
            { name: "Limpieza dental", durationMin: 45, defaultActive: true },
            { name: "Revisión", durationMin: 15, defaultActive: true },
            { name: "Empaste", durationMin: 45, defaultActive: false },
            { name: "Blanqueamiento", durationMin: 60, defaultActive: false },
            { name: "Ortodoncia", durationMin: 30, defaultActive: false },
            { name: "Urgencia dental", durationMin: 30, defaultActive: true },
        ]
    },
    {
        id: "fisioterapia",
        sector: "Fisioterapia",
        services: [
            { name: "Primera sesión", durationMin: 60, defaultActive: true },
            { name: "Sesión fisioterapia", durationMin: 45, defaultActive: true },
            { name: "Rehabilitación", durationMin: 45, defaultActive: true },
            { name: "Masaje deportivo", durationMin: 60, defaultActive: false },
            { name: "Evaluación", durationMin: 30, defaultActive: false },
        ]
    },
    {
        id: "restaurante",
        sector: "Restaurante / Cafetería",
        services: [
            { name: "Mesa 1 persona", durationMin: 90, defaultActive: true },
            { name: "Mesa 2 personas", durationMin: 90, defaultActive: true },
            { name: "Mesa 3 personas", durationMin: 90, defaultActive: true },
            { name: "Mesa 4 personas", durationMin: 90, defaultActive: true },
            { name: "Mesa 5 personas", durationMin: 90, defaultActive: true },
            { name: "Mesa 6 personas", durationMin: 90, defaultActive: true },
            { name: "Reserva mesa 2 personas", durationMin: 90, defaultActive: false },
            { name: "Reserva mesa 4 personas", durationMin: 90, defaultActive: false },
            { name: "Reserva grupo", durationMin: 120, defaultActive: false },
            { name: "Evento privado", durationMin: 240, defaultActive: false },
        ],
        botLogic: "restaurant"
    },
    {
        id: "taller",
        sector: "Taller de coches",
        services: [
            { name: "Cambio de aceite", durationMin: 45, defaultActive: true },
            { name: "Cambio de ruedas", durationMin: 60, defaultActive: true },
            { name: "Revisión general", durationMin: 90, defaultActive: true },
            { name: "Batería", durationMin: 30, defaultActive: false },
            { name: "ITV pre-revisión", durationMin: 60, defaultActive: false },
            { name: "Diagnóstico", durationMin: 45, defaultActive: true },
        ]
    },
    {
        id: "asesoria",
        sector: "Asesoría / Gestoría",
        services: [
            { name: "Consulta fiscal", durationMin: 30, defaultActive: true },
            { name: "Consulta laboral", durationMin: 30, defaultActive: true },
            { name: "Consulta contable", durationMin: 30, defaultActive: true },
            { name: "Revisión documentación", durationMin: 45, defaultActive: false },
        ]
    }
];

export function getTemplateBySector(sector: string): SectorTemplate | undefined {
    return SECTOR_TEMPLATES.find(t => t.sector === sector);
}
