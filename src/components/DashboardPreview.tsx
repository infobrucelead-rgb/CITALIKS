"use client";

import React from "react";
import { motion } from "framer-motion";

export default function DashboardPreview() {
    const [activeTab, setActiveTab] = React.useState("Calendario");

    const tabs = [
        { name: "Calendario", icon: "calendar_month" },
        { name: "Llamadas", icon: "call" },
        { name: "Clientes", icon: "group" },
        { name: "Configuración", icon: "settings" },
    ];

    const tabData: Record<string, { stats: any[], table: any[], tableTitle: string }> = {
        "Calendario": {
            stats: [
                { label: "Citas Hoy", value: "14", trend: "+2", color: "surface" },
                { label: "Llamadas Atendidas", value: "42", trend: "98%", color: "surface" },
                { label: "Citas Nuevas", value: "+8", trend: "Hoy", color: "tertiary" },
            ],
            tableTitle: "Próximas Citas",
            table: [
                { col1: "Juan Pérez", col2: "Limpieza Dental", col3: "10:30 AM", status: "Confirmado" },
                { col1: "Ana López", col2: "Extracción", col3: "11:15 AM", status: "Confirmado" },
                { col1: "Carlos Ruiz", col2: "Revisión Anual", col3: "12:45 PM", status: "Sincronizando..." },
                { col1: "Marta Sánchez", col2: "Blanqueamiento", col3: "14:00 PM", status: "Confirmado" },
            ]
        },
        "Llamadas": {
            stats: [
                { label: "Llamadas Totales", value: "128", trend: "+12", color: "surface" },
                { label: "Tiempo Medio", value: "2:45", trend: "-15s", color: "surface" },
                { label: "Conversión", value: "85%", trend: "+5%", color: "tertiary" },
            ],
            tableTitle: "Historial de Llamadas",
            table: [
                { col1: "+34 600...123", col2: "Reserva Cita", col3: "Hace 5 min", status: "Atendida" },
                { col1: "+34 677...444", col2: "Consulta Precio", col3: "Hace 12 min", status: "Atendida" },
                { col1: "+34 655...888", col2: "Cancelación", col3: "Hace 1h", status: "Gestionada" },
                { col1: "+34 611...999", col2: "Reserva Cita", col3: "Hace 2h", status: "Atendida" },
            ]
        },
        "Clientes": {
            stats: [
                { label: "Total Clientes", value: "842", trend: "+24", color: "surface" },
                { label: "Recurrencia", value: "62%", trend: "+3%", color: "surface" },
                { label: "Satisfacción", value: "4.9", trend: "/5.0", color: "tertiary" },
            ],
            tableTitle: "Clientes Recientes",
            table: [
                { col1: "Roberto Gómez", col2: "Premium", col3: "12 visitas", status: "Activo" },
                { col1: "Laura Estévez", col2: "Basic", col3: "2 visitas", status: "Nuevo" },
                { col1: "Pedro Martínez", col2: "Business", col3: "5 visitas", status: "Activo" },
                { col1: "Sandra Valle", col2: "Premium", col3: "8 visitas", status: "Activo" },
            ]
        },
        "Configuración": {
            stats: [
                { label: "Voz Activa", value: "Carolina", trend: "HD", color: "surface" },
                { label: "Integraciones", value: "4/5", trend: "OK", color: "surface" },
                { label: "Seguridad", value: "Máxima", trend: "SSL", color: "tertiary" },
            ],
            tableTitle: "Estado de Conexiones",
            table: [
                { col1: "Retell Realtime", col2: "IA Vocal", col3: "Latencia 400ms", status: "Online" },
                { col1: "Google Calendar", col2: "Sincronización", col3: "Última: 1 min", status: "Online" },
                { col1: "SMS Gateway", col2: "Notificaciones", col3: "Enviados: 1.2k", status: "Online" },
                { col1: "CRM Citaliks", col2: "Base de Datos", col3: "Sincronizado", status: "Online" },
            ]
        }
    };

    const currentData = tabData[activeTab] || tabData["Calendario"];

    return (
        <div className="bg-surface-container rounded-3xl p-4 lg:p-10 relief-premium overflow-hidden border border-white/5">
            <div className="grid grid-cols-12 gap-8 h-[600px]">
                {/* Sidebar */}
                <div className="col-span-3 bg-surface-container-highest/50 rounded-2xl p-6 hidden md:flex flex-col gap-6 text-left border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-lg logo-neon">
                            <span className="material-symbols-outlined text-xl">grid_view</span>
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-white">CitaLiks Panel</span>
                    </div>
                    <div className="space-y-3">
                        {tabs.map((item) => (
                                <div 
                                    key={item.name}
                                    onClick={() => setActiveTab(item.name)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                                        activeTab === item.name 
                                            ? "bg-primary text-black shadow-[0_10px_20px_rgba(32,185,95,0.3)] scale-[1.02]" 
                                            : "text-white/40 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-lg ${activeTab === item.name ? "text-black" : "text-white/40 group-hover:text-primary"}`}>
                                        {item.icon}
                                    </span>
                                    <span>{item.name}</span>
                                </div>
                        ))}
                    </div>
                    
                    <div className="mt-auto bg-primary/10 p-5 rounded-2xl border border-primary/20">
                        <p className="text-[10px] font-black uppercase text-primary mb-2">Plan Escogido</p>
                        <p className="font-black text-xs text-white">Business AI</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-span-12 md:col-span-9 flex flex-col gap-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {currentData.stats.map((stat, i) => (
                            <motion.div 
                                key={`${activeTab}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -5 }}
                                className={`p-8 rounded-2xl text-left border border-white/5 ${
                                    stat.color === "tertiary" ? "bg-primary text-black shadow-[0_20px_40px_rgba(32,185,95,0.2)]" : "bg-white/5 text-white"
                                }`}
                            >
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${stat.color === "tertiary" ? "text-black/60" : "text-white/40"}`}>
                                    {stat.label}
                                </p>
                                <div className="flex items-baseline justify-between">
                                    <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
                                    <span className="text-[10px] font-bold opacity-60">{stat.trend}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Table */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        key={activeTab}
                        className="bg-white/5 rounded-2xl p-8 flex-1 border border-white/5 overflow-y-auto custom-scrollbar"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="font-black text-sm uppercase tracking-widest text-white">{currentData.tableTitle}</h4>
                            <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 border border-primary/20 rounded-full uppercase">Realtime Demo</span>
                        </div>
                        <table className="w-full text-left text-xs text-white border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-white/40">
                                    <th className="pb-2 font-black uppercase tracking-tighter">Detalle</th>
                                    <th className="pb-2 font-black uppercase tracking-tighter">Categoría</th>
                                    <th className="pb-2 font-black uppercase tracking-tighter">Contexto</th>
                                    <th className="pb-2 font-black uppercase tracking-tighter text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.table.map((row, i) => (
                                    <motion.tr 
                                        key={i} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                                        className="group cursor-default"
                                    >
                                        <td className="py-2 pr-4"><span className="font-black text-primary group-hover:text-green-400">{row.col1}</span></td>
                                        <td className="py-2 pr-4 text-white/60 font-medium">{row.col2}</td>
                                        <td className="py-2 pr-4 text-white/40 font-bold">{row.col3}</td>
                                        <td className="py-2 text-right">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                                                statIsPositive(row.status) ? "bg-primary/20 text-primary border border-primary/10" : "bg-white/10 text-white/60"
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function statIsPositive(status: string) {
    const positives = ["Confirmado", "Atendida", "Gestionada", "Activo", "Online"];
    return positives.includes(status);
}
