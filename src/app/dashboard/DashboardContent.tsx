"use client";
import React, { useState, useEffect } from "react";
import {
    LayoutDashboard, Users, Calendar, Phone, Activity,
    Settings, LogOut, Clock, ShieldCheck, Plus,
    Trash2, Search, UserPlus, Image as ImageIcon,
    ExternalLink, Brain, Loader2, Edit2, ChevronRight, DollarSign, X
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { DAY_NAMES, formatDuration, formatPrice } from "@/lib/utils";

type TabType = "overview" | "calls" | "services" | "config" | "team" | "admin";

export default function DashboardContent({ client: initialClient }: { client: any }) {
    const [client, setClient] = useState(initialClient);
    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const { signOut } = useClerk();

    // Helper to refresh data
    const refreshData = async () => {
        try {
            const res = await fetch('/api/onboarding', { cache: 'no-store' });
            const data = await res.json();
            if (data.client) {
                setClient(data.client);
                // Update selected staff if it exists
                if (selectedStaff) {
                    const updatedStaff = (data.client.staff || []).find((s: any) => s.id === selectedStaff.id);
                    if (updatedStaff) setSelectedStaff(updatedStaff);
                }
            }
        } catch (err) {
            console.error("Error refreshing dashboard data:", err);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case "overview":
                return <OverviewTab client={client} />;
            case "calls":
                return <CallsTab client={client} />;
            case "services":
                return <ServicesTab client={client} onUpdate={refreshData} selectedStaff={selectedStaff} setSelectedStaff={setSelectedStaff} />;
            case "team":
                return <TeamTab client={client} onUpdate={refreshData} onSelectStaff={(s) => { setSelectedStaff(s); setActiveTab("services"); }} />;
            case "config":
                return <ConfigTab client={client} onUpdate={refreshData} />;
            default:
                return <OverviewTab client={client} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex relative">
            {/* Sidebar */}
            <aside className="fixed top-0 left-0 h-screen z-50 w-[72px] hover:w-64 border-r border-white/5 bg-[#0a0a0f] p-3 md:p-4 flex flex-col gap-6 md:gap-8 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group overflow-x-hidden overflow-y-auto custom-scrollbar shadow-2xl md:shadow-none">
                <div className="flex items-center gap-3 px-1 mt-2">
                    <div className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center overflow-hidden">
                        <img src="/logo.png" alt="CitaLiks Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">CitaLiks</span>
                </div>

                <nav className="space-y-2 flex-1">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Vista general"
                        active={activeTab === "overview"}
                        onClick={() => setActiveTab("overview")}
                    />
                    <NavItem
                        icon={<Phone size={20} />}
                        label="Llamadas"
                        active={activeTab === "calls"}
                        onClick={() => setActiveTab("calls")}
                    />
                    <NavItem
                        icon={<Users size={20} />}
                        label="Equipo"
                        active={activeTab === "team"}
                        onClick={() => setActiveTab("team")}
                    />
                    <NavItem
                        icon={<Calendar size={20} />}
                        label="Servicios & Horarios"
                        active={activeTab === "services"}
                        onClick={() => setActiveTab("services")}
                    />
                    <NavItem
                        icon={<Settings size={20} />}
                        label="Configuración"
                        active={activeTab === "config"}
                        onClick={() => setActiveTab("config")}
                    />

                    {client.role === "PLATFORM_ADMIN" && (
                        <div className="pt-6 mt-6 border-t border-white/5">
                            <p className="px-1 mb-2 text-[10px] uppercase font-bold text-white/20 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity truncate">Platform</p>
                            <NavItem
                                icon={<ShieldCheck className="text-amber-400" size={20} />}
                                label="Panel Admin"
                                active={activeTab === "admin"}
                                onClick={() => window.location.href = "/dashboard/admin"}
                            />
                        </div>
                    )}
                </nav>

                <div className="border-t border-white/5 pt-6 space-y-4">
                    <div className="px-1 py-3 rounded-2xl bg-white/5 border border-white/5 text-center flex flex-col items-center justify-center min-h-[50px]">
                        <p className="text-[10px] text-white/40 uppercase font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:block">Negocio</p>
                        <p className="text-sm font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity w-full hidden group-hover:block">{client.businessName}</p>
                        <div className="group-hover:hidden text-white/40 font-bold text-sm w-full text-center">
                            {client.businessName.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all group/logout">
                        <LogOut size={20} className="shrink-0 group-hover/logout:-translate-x-1 transition-transform" />
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-10 ml-[72px]">
                {renderContent()}
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-all group/nav ${active
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-white/40 hover:text-white hover:bg-white/5"
                }`}>
            <div className="shrink-0 flex items-center justify-center w-5 h-5">{icon}</div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-left flex-1">{label}</span>
        </button>
    );
}

function Header({ title, subtitle, status, actions }: { title: string, subtitle: string, status?: boolean, actions?: React.ReactNode }) {
    return (
        <header className="flex justify-between items-end mb-10">
            <div>
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                <p className="text-white/40 text-sm">{subtitle}</p>
            </div>
            <div className="flex items-center gap-4">
                {actions}
                {status !== undefined && (
                    <div className={`px-4 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 ${status
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${status ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                        Agente {status ? "Activo" : "Pausado"}
                    </div>
                )}
            </div>
        </header>
    );
}

function OverviewTab({ client }: { client: any }) {
    return (
        <>
            <Header
                title={`¡Hola ${client.agentName?.split(' ')[0] || "Asistente"}!`}
                subtitle="Aquí tienes el resumen de Cita Liks para hoy."
                status={client.onboardingDone}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <StatCard title="Llamadas totales" value={client.callLogs?.length || 0} trend="+0%" icon={<Phone className="text-blue-400" />} />
                <StatCard title="Citas agendadas" value={client.callLogs?.filter((l: any) => l.actionTaken === 'booked').length || 0} trend="+0%" icon={<Calendar className="text-blue-400" />} />
                <StatCard title="Equipo activo" value={client.staff?.length || 0} trend="OK" icon={<Users className="text-emerald-400" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="glass p-6 rounded-[2rem] border-white/5 bg-blue-600/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-600/20"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400">
                            <Phone size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Línea del Asistente</p>
                            <h3 className="text-xl font-mono font-bold text-white">{client.phone || "No configurada"}</h3>
                        </div>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">Este es el número que tus clientes llaman para hablar con tu asistente de IA.</p>
                </div>

                <div className="glass p-6 rounded-[2rem] border-white/5 bg-violet-600/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-violet-600/20"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-violet-600/20 text-violet-400">
                            <ExternalLink size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Desvío a Humano</p>
                            <h3 className="text-xl font-mono font-bold text-white">{client.transferPhone || "No configurado"}</h3>
                        </div>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">Las llamadas se desviarán a este número si el cliente lo solicita o hay una emergencia.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold">Últimas llamadas</h2>
                    <CallsList logs={client.callLogs?.slice(0, 5) || []} />
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold">Tu configuración</h2>
                    <div className="glass rounded-3xl p-6 space-y-6">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-3">Servicios ({client.services?.length || 0})</label>
                            <div className="space-y-2">
                                {client.services?.slice(0, 3).map((s: any) => (
                                    <div key={s.id} className="flex justify-between items-center text-sm p-3 rounded-xl bg-white/2 border border-white/5">
                                        <span className="text-white/80">{s.name}</span>
                                        <span className="text-white/40">{formatDuration(s.durationMin)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-3">Número de contacto</label>
                            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-blue-600/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                <span className="relative z-10 text-xl font-mono font-bold text-blue-300">{client.phone || "+34 900 000 000"}</span>
                                <p className="relative z-10 text-[9px] text-blue-300/60 mt-1 uppercase tracking-wider">Línea activa de Cita Liks</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function CallsTab({ client }: { client: any }) {
    return (
        <>
            <Header title="Registro de Llamadas" subtitle="Historial de todas las interacciones con tus clientes." />
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={16} />
                        <input
                            placeholder="Buscar por número..."
                            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-600 transition-all w-64"
                        />
                    </div>
                </div>
                <CallsList logs={client.callLogs || []} />
            </div>
        </>
    );
}

function TeamTab({ client, onUpdate, onSelectStaff }: { client: any, onUpdate: () => void, onSelectStaff: (s: any) => void }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [newData, setNewData] = useState({ name: "", email: "", googleCalendarId: "primary" });

    const handleAddStaff = async () => {
        if (!newData.name) return;
        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                body: JSON.stringify(newData)
            });
            if (res.ok) {
                setNewData({ name: "", email: "", googleCalendarId: "primary" });
                setIsAdding(false);
                onUpdate();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateStaff = async () => {
        if (!editingStaff || !editingStaff.name) return;
        try {
            const res = await fetch('/api/staff', {
                method: 'PATCH',
                body: JSON.stringify(editingStaff)
            });
            if (res.ok) {
                setEditingStaff(null);
                onUpdate();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteStaff = async (id: string) => {
        if (!confirm("¿Borrar profesional?")) return;
        try {
            await fetch(`/api/staff?id=${id}`, { method: 'DELETE' });
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <Header
                title="Equipo & Profesionales"
                subtitle="Gestiona el personal y sus calendarios individuales."
                actions={
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all">
                        <UserPlus size={18} /> Añadir Profesional
                    </button>
                }
            />

            {(isAdding || editingStaff) && (
                <div className="glass p-8 rounded-3xl mb-8 border-blue-500/30 animate-in fade-in slide-in-from-top-4 space-y-4">
                    <h3 className="text-lg font-bold">{editingStaff ? 'Editar Profesional' : 'Nuevo Profesional'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-2 px-1">Nombre</label>
                            <input
                                placeholder="Nombre completo"
                                value={editingStaff ? editingStaff.name : newData.name}
                                onChange={(e) => editingStaff
                                    ? setEditingStaff({ ...editingStaff, name: e.target.value })
                                    : setNewData({ ...newData, name: e.target.value })
                                }
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-2 px-1">Email (Opcional)</label>
                            <input
                                placeholder="profesional@ejemplo.com"
                                value={editingStaff ? (editingStaff.email || "") : newData.email}
                                onChange={(e) => editingStaff
                                    ? setEditingStaff({ ...editingStaff, email: e.target.value })
                                    : setNewData({ ...newData, email: e.target.value })
                                }
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-2 px-1">Google Calendar ID</label>
                            <input
                                placeholder="primary o ID de calendario"
                                value={editingStaff ? (editingStaff.googleCalendarId || "") : newData.googleCalendarId}
                                onChange={(e) => editingStaff
                                    ? setEditingStaff({ ...editingStaff, googleCalendarId: e.target.value })
                                    : setNewData({ ...newData, googleCalendarId: e.target.value })
                                }
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={editingStaff ? handleUpdateStaff : handleAddStaff}
                            className="bg-white text-black px-8 py-2 rounded-xl text-sm font-bold hover:bg-white/90 transition-all shadow-xl"
                        >
                            {editingStaff ? 'Guardar Cambios' : 'Guardar Profesional'}
                        </button>
                        <button
                            onClick={() => { setIsAdding(false); setEditingStaff(null); }}
                            className="text-white/40 hover:text-white px-4"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(client.staff || []).map((member: any) => (
                    <div key={member.id} className="glass p-6 rounded-3xl group relative">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                                <Users size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1">{member.name}</h3>
                                <p className="text-xs text-white/40">{member.email || "Sin email configurado"}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingStaff(member); }}
                                    className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                    <Settings size={16} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteStaff(member.id); }}
                                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => onSelectStaff(member)}
                                className="w-full py-2 bg-white/5 hover:bg-blue-600/20 text-white/60 hover:text-blue-400 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all border border-white/5 hover:border-blue-600/30 flex items-center justify-center gap-2">
                                <Calendar size={14} /> Ver Agenda y Servicios
                            </button>
                            <div className="flex items-center justify-between text-[10px] text-white/20 uppercase font-bold tracking-widest border-t border-white/5 pt-3">
                                <span>Calendario Google</span>
                                <span className="text-blue-400">{member.googleCalendarId === 'primary' ? 'Principal' : 'Personalizado'}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {(client.staff || []).length === 0 && (
                    <div className="col-span-full py-20 text-center glass rounded-3xl border-dashed border-white/10">
                        <Users size={48} className="text-white/5 mx-auto mb-4" />
                        <p className="text-white/40">No hay profesionales registrados.</p>
                        <button onClick={() => setIsAdding(true)} className="text-blue-400 text-sm font-bold mt-2 hover:underline">Registrar el primero</button>
                    </div>
                )}
            </div>
        </>
    );
}

function ServicesTab({ client, onUpdate, selectedStaff, setSelectedStaff }: { client: any, onUpdate: () => void, selectedStaff?: any, setSelectedStaff: (s: any) => void }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const [newService, setNewService] = useState({ name: "", durationMin: 30, price: "" });
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);
    const [localSchedules, setLocalSchedules] = useState<any[]>([]);

    // Services for the current context (business or specific staff)
    const contextServices = (client.services || []).filter((s: any) =>
        selectedStaff ? s.staffId === selectedStaff.id : (s.staffId === null || !s.staffId)
    );

    // Sync local schedules when client data or selectedStaff changes
    useEffect(() => {
        const filtered = (client.schedules || []).filter((s: any) =>
            selectedStaff ? s.staffId === selectedStaff.id : (s.staffId === null || !s.staffId)
        );
        setLocalSchedules(filtered);
    }, [client.schedules, selectedStaff]);

    const handleAdd = async () => {
        try {
            const data = {
                ...newService,
                staffId: selectedStaff?.id || null
            };
            const res = await fetch('/api/services', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setIsAdding(false);
                setNewService({ name: "", durationMin: 30, price: "" });
                onUpdate();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = async () => {
        try {
            const res = await fetch('/api/services', {
                method: 'PATCH',
                body: JSON.stringify(editingService)
            });
            if (res.ok) {
                setEditingService(null);
                onUpdate();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Borrar servicio?")) return;
        try {
            await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const handleScheduleToggle = async (dayIdx: number, isOpen: boolean) => {
        const schedule = localSchedules.find((sch: any) => sch.dayOfWeek === dayIdx);
        const data = {
            dayOfWeek: dayIdx,
            isOpen,
            openTime: schedule?.openTime || "09:00",
            closeTime: schedule?.closeTime || "18:00",
            staffId: selectedStaff?.id || null
        };

        // Optimistic update
        const updated = [...localSchedules.filter((s: any) => s.dayOfWeek !== dayIdx), data].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
        setLocalSchedules(updated);

        try {
            const res = await fetch('/api/schedules', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (res.ok) onUpdate();
        } catch (err) {
            console.error(err);
            onUpdate(); // Rollback if error
        }
    };

    const handleTimeUpdate = async (dayIdx: number, field: 'openTime' | 'closeTime', value: string) => {
        const schedule = localSchedules.find((sch: any) => sch.dayOfWeek === dayIdx);
        if (!schedule) return;

        const data = {
            ...schedule,
            [field]: value,
            staffId: selectedStaff?.id || null
        };

        // Optimistic update
        const updated = localSchedules.map((s: any) => s.dayOfWeek === dayIdx ? data : s);
        setLocalSchedules(updated);

        try {
            const res = await fetch('/api/schedules', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (res.ok) onUpdate();
        } catch (err) {
            console.error(err);
            onUpdate(); // Rollback
        }
    };

    return (
        <>
            <Header
                title={selectedStaff ? `Agenda de ${selectedStaff.name}` : "Servicios & Horarios"}
                subtitle={selectedStaff ? "Gestiona la disponibilidad y servicios exclusivos de este profesional." : "Define qué servicios ofreces y la disponibilidad general del negocio."}
                actions={
                    <div className="flex gap-3">
                        {selectedStaff && (
                            <button
                                onClick={() => setSelectedStaff(null)}
                                className="bg-white/5 text-white/40 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/5">
                                Ver Todo el Negocio
                            </button>
                        )}
                        <button
                            onClick={() => setIsEditingSchedule(!isEditingSchedule)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isEditingSchedule ? "bg-amber-500/20 text-amber-400 border border-amber-500/20" : "bg-white/5 text-white/60 hover:bg-white/10"
                                }`}>
                            <Settings size={18} /> {isEditingSchedule ? "Finalizar Edición" : "Configurar Horarios"}
                        </button>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/90 transition-all">
                            <Plus size={18} /> Nuevo Servicio
                        </button>
                    </div>
                }
            />

            {/* Modal de Edición */}
            {editingService && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="glass max-w-md w-full p-8 rounded-[2rem] border-white/10 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-bold mb-6">Editar Servicio</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest block mb-2 px-1">Nombre del Servicio</label>
                                <input
                                    type="text"
                                    value={editingService.name}
                                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-blue-600 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest block mb-2 px-1">Duración (min)</label>
                                    <input
                                        type="number"
                                        value={editingService.durationMin}
                                        onChange={(e) => setEditingService({ ...editingService, durationMin: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-blue-600 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest block mb-2 px-1">Precio (€)</label>
                                    <input
                                        type="number"
                                        value={editingService.price || ""}
                                        onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-blue-600 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditingService(null)}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-sm font-bold hover:bg-white/10 transition-all">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleEdit}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-sm font-bold shadow-xl shadow-blue-600/20 hover:bg-violet-700 transition-all">
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAdding && (
                <div className="glass p-6 rounded-3xl mb-8 border-white/20 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold mb-4">Nuevo Servicio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-2">Nombre</label>
                            <input
                                value={newService.name}
                                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-2">Minutos</label>
                            <input
                                type="number"
                                value={newService.durationMin}
                                onChange={(e) => setNewService({ ...newService, durationMin: parseInt(e.target.value) || 0 })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-2">Precio (€)</label>
                            <input
                                value={newService.price}
                                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 mt-6">
                        <button onClick={handleAdd} className="bg-blue-600 text-white px-8 py-2 rounded-xl text-sm font-bold">Guardar Servicio</button>
                        <button onClick={() => setIsAdding(false)} className="text-white/40 hover:text-white px-4">Cancelar</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Activity size={20} className="text-blue-400" /> {selectedStaff ? `Servicios de ${selectedStaff.name}` : "Servicios del Negocio"}
                    </h2>
                    <div className="space-y-3">
                        {contextServices.map((s: any) => (
                            <div key={s.id} className="glass p-4 rounded-2xl flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                                        <Activity size={20} className="text-white/40 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-bold">{s.name}</p>
                                        <p className="text-xs text-white/40">{s.durationMin} min {s.price ? `• ${s.price}€` : ""}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingService(s)}
                                        className="p-2 text-white hover:bg-white/5 rounded-xl transition-all">
                                        <Settings size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        className="p-2 text-white hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar size={20} className="text-blue-400" /> Horario Semanal
                    </h2>
                    <div className="glass p-8 rounded-[2rem] space-y-5 border-white/5 shadow-2xl relative overflow-y-auto max-h-[500px] custom-scrollbar">
                        {Array.from({ length: 7 }, (_, i) => {
                            const dayIdx = i; // 0=Lunes, 1=Martes... 6=Domingo
                            const schedule = localSchedules.find((s: any) => s.dayOfWeek === dayIdx) || {
                                dayOfWeek: dayIdx,
                                isOpen: false,
                                openTime: "09:00",
                                closeTime: "18:00"
                            };
                            const dayName = DAY_NAMES[dayIdx];

                            return (
                                <div key={dayName} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-3">
                                        {isEditingSchedule && (
                                            <input
                                                type="checkbox"
                                                checked={schedule?.isOpen ?? false}
                                                onChange={(e) => handleScheduleToggle(dayIdx, e.target.checked)}
                                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-600 cursor-pointer"
                                            />
                                        )}
                                        <span className={`text-sm font-medium ${schedule?.isOpen ? 'text-white' : 'text-white/20'}`}>{dayName}</span>
                                    </div>

                                    {schedule?.isOpen ? (
                                        <div className="flex items-center gap-2">
                                            {isEditingSchedule ? (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={schedule.openTime}
                                                        onChange={(e) => handleTimeUpdate(dayIdx, 'openTime', e.target.value)}
                                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-blue-400 outline-none focus:border-blue-600"
                                                    />
                                                    <span className="text-white/20">-</span>
                                                    <input
                                                        type="time"
                                                        value={schedule.closeTime}
                                                        onChange={(e) => handleTimeUpdate(dayIdx, 'closeTime', e.target.value)}
                                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-blue-400 outline-none focus:border-blue-600"
                                                    />
                                                </>
                                            ) : (
                                                <span className="text-xs font-mono font-bold bg-blue-600/10 text-blue-400 px-3 py-1 rounded-lg border border-blue-600/20">
                                                    {schedule.openTime} - {schedule.closeTime}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[9px] uppercase font-black text-white/10 px-3 py-1 bg-white/2 rounded-lg border border-white/5 tracking-widest">Cerrado</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {selectedStaff && (
                <div className="pt-10">
                    <StaffCalendar staffId={selectedStaff.id} staffName={selectedStaff.name} />
                </div>
            )}
        </>
    );
}

function StaffCalendar({ staffId, staffName }: { staffId: string, staffName: string }) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
    const [currentStart, setCurrentStart] = useState(() => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(now.setDate(diff));
    });
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const dateInputRef = React.useRef<HTMLInputElement>(null);

    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00

    const getDaysForView = () => {
        if (viewMode === "day") return [new Date(currentStart)];
        if (viewMode === "week") {
            return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(currentStart);
                d.setDate(d.getDate() + i);
                return d;
            });
        }
        const startOfMonth = new Date(currentStart.getFullYear(), currentStart.getMonth(), 1);
        const startDay = startOfMonth.getDay();
        const daysFromPrevMonth = startDay === 0 ? 6 : startDay - 1;

        const calendarStart = new Date(startOfMonth);
        calendarStart.setDate(calendarStart.getDate() - daysFromPrevMonth);

        return Array.from({ length: 42 }, (_, i) => {
            const d = new Date(calendarStart);
            d.setDate(d.getDate() + i);
            return d;
        });
    };

    const calendarDays = getDaysForView();

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/calendar/events?staffId=${staffId}`);
                const data = await res.json();
                if (data.events) setEvents(data.events);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [staffId, currentStart, viewMode]);

    const navigate = (offset: number) => {
        const newDate = new Date(currentStart);
        if (viewMode === "day") newDate.setDate(newDate.getDate() + offset);
        else if (viewMode === "week") newDate.setDate(newDate.getDate() + offset * 7);
        else if (viewMode === "month") newDate.setMonth(newDate.getMonth() + offset);
        setCurrentStart(newDate);
    };

    const handleDateJump = (dateStr: string) => {
        const selected = new Date(dateStr);
        // Add timezone offset to avoid "day before" issues with UTC conversion
        const offset = selected.getTimezoneOffset() * 60000;
        const localDate = new Date(selected.getTime() + offset);

        if (viewMode === "day") {
            setCurrentStart(localDate);
        } else if (viewMode === "week") {
            const day = localDate.getDay();
            const diff = localDate.getDate() - day + (day === 0 ? -6 : 1);
            setCurrentStart(new Date(localDate.setDate(diff)));
        } else if (viewMode === "month") {
            setCurrentStart(new Date(localDate.getFullYear(), localDate.getMonth(), 1));
        }
    };

    const getEventStyle = (event: any) => {
        const start = new Date(event.start.dateTime || event.start.date);
        const end = new Date(event.end.dateTime || event.end.date);
        const startTotalMinutes = start.getHours() * 60 + start.getMinutes();
        const gridStartMinutes = 8 * 60;
        const top = ((startTotalMinutes - gridStartMinutes) / 60) * 80;
        const durationMin = (end.getTime() - start.getTime()) / 60000;
        const height = (durationMin / 60) * 80;
        return {
            top: `${top + 40}px`,
            height: `${Math.max(height, 20)}px`,
            zIndex: 10
        };
    };

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    return (
        <div className="glass p-8 rounded-[2rem] border-white/5 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                        <Calendar size={22} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Agenda de {staffName}</h3>
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none mt-0.5">Vista {viewMode === 'day' ? 'Diaria' : viewMode === 'week' ? 'Semanal' : 'Mensual'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                        {(["day", "week", "month"] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => setViewMode(v)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${viewMode === v ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white"}`}
                            >
                                {v === 'day' ? 'Día' : v === 'week' ? 'Sem' : 'Mes'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                            <ChevronRight size={18} className="rotate-180" />
                        </button>
                        <div className="relative">
                            <input
                                type="date"
                                ref={dateInputRef}
                                onChange={(e) => handleDateJump(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
                            />
                            <span
                                onClick={() => dateInputRef.current?.showPicker()}
                                className="text-xs font-bold px-3 uppercase tracking-widest text-white/60 hover:text-blue-400 cursor-pointer transition-colors"
                            >
                                {viewMode === 'month'
                                    ? currentStart.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
                                    : currentStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                        </div>
                        <button onClick={() => navigate(1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative border border-white/5 rounded-3xl overflow-hidden bg-black/20">
                {viewMode !== 'month' ? (
                    <>
                        <div className="grid grid-cols-[80px_1fr] border-b border-white/5 bg-white/2">
                            <div className="h-10 border-r border-white/5" />
                            <div className={`grid h-10 ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
                                {calendarDays.map((day, i) => (
                                    <div key={i} className={`flex items-center justify-center gap-2 border-r border-white/5 last:border-0 ${isSameDay(day, new Date()) ? 'bg-blue-600/10' : ''}`}>
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${isSameDay(day, new Date()) ? 'text-blue-400' : 'text-white/40'}`}>
                                            {DAY_NAMES[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                                        </span>
                                        <span className={`text-xs font-bold ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-white/60'}`}>
                                            {day.getDate()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-[80px_1fr] relative h-[800px] overflow-y-auto custom-scrollbar">
                            <div className="border-r border-white/5 bg-white/[0.01]">
                                {hours.map(h => (
                                    <div key={h} className="h-20 border-b border-white/5 flex justify-center pt-2">
                                        <span className="text-[10px] font-mono font-bold text-white/20 tracking-tighter">
                                            {h.toString().padStart(2, '0')}:00
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className={`grid h-full relative ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
                                {calendarDays.map((_, i) => (
                                    <div key={i} className="border-r border-white/5 last:border-0 relative h-full">
                                        {hours.map(h => (
                                            <div key={h} className="h-20 border-b border-white/5" />
                                        ))}
                                    </div>
                                ))}

                                {!loading && events.map((event, idx) => {
                                    const eventStart = new Date(event.start.dateTime || event.start.date);
                                    const dayIdx = calendarDays.findIndex(d => isSameDay(d, eventStart));
                                    if (dayIdx === -1) return null;

                                    return (
                                        <div
                                            key={event.id || idx}
                                            onClick={() => setSelectedEvent(event)}
                                            style={{
                                                ...getEventStyle(event),
                                                gridColumnStart: dayIdx + 1,
                                                width: 'calc(100% - 4px)',
                                                left: '2px'
                                            }}
                                            className={`absolute p-2 rounded-lg text-[10px] font-bold border flex flex-col justify-center overflow-hidden transition-all hover:scale-[1.01] hover:brightness-125 hover:z-50 cursor-pointer shadow-lg ${event.source === 'local'
                                                ? 'bg-blue-600 border-blue-400 text-white'
                                                : 'bg-emerald-600 border-emerald-400 text-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-1 mb-0.5">
                                                {event.source === 'local' ? <Brain size={8} /> : <Calendar size={8} />}
                                                <span className="truncate">{event.summary || '(Sin título)'}</span>
                                            </div>
                                            <span className="opacity-60 text-[8px] font-mono">
                                                {eventStart.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="grid grid-cols-7 border-white/5 h-[600px] overflow-y-auto">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="h-10 bg-white/5 border-r border-b border-white/5 flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">{DAY_NAMES[i]}</span>
                            </div>
                        ))}
                        {calendarDays.map((day, i) => {
                            const dayEvents = events.filter(e => isSameDay(new Date(e.start.dateTime || e.start.date), day));
                            const isToday = isSameDay(day, new Date());
                            const isCurrentMonth = day.getMonth() === currentStart.getMonth();

                            return (
                                <div key={i} className={`min-h-[100px] border-r border-b border-white/5 p-2 relative overflow-hidden group ${!isCurrentMonth ? 'opacity-20' : ''}`}>
                                    <span className={`text-xs font-bold absolute top-2 right-3 ${isToday ? 'bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-white/40'}`}>
                                        {day.getDate()}
                                    </span>
                                    <div className="mt-6 space-y-1">
                                        {dayEvents.slice(0, 3).map((e, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedEvent(e)}
                                                className={`text-[8px] p-1 rounded-md truncate cursor-pointer transition-colors ${e.source === 'local' ? 'bg-blue-600/80 text-white hover:bg-blue-500' : 'bg-emerald-600/80 text-white hover:bg-emerald-500'}`}
                                            >
                                                {e.summary}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <p className="text-[8px] text-white/20 font-bold ml-1">+{dayEvents.length - 3} más</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50">
                        <Loader2 size={32} className="animate-spin text-blue-400" />
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-6 px-4 pt-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-600 border border-blue-400" />
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Citas del Bot</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-600 border border-emerald-400" />
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Google Calendar</span>
                </div>
            </div>

            {selectedEvent && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="glass p-8 rounded-[2.5rem] border-white/10 w-full max-w-md animate-in fade-in zoom-in duration-300 shadow-2xl relative">
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className={`p-4 rounded-2xl ${selectedEvent.source === 'local' ? 'bg-blue-600/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {selectedEvent.source === 'local' ? <Brain size={24} /> : <Calendar size={24} />}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-1">{selectedEvent.summary}</h4>
                                <p className="text-xs text-white/40 uppercase font-black tracking-widest">
                                    {selectedEvent.source === 'local' ? 'Cita del Bot' : 'Google Calendar'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-white/20 uppercase font-bold mb-1 tracking-widest">Fecha</p>
                                    <p className="text-sm font-bold text-white/80">
                                        {new Date(selectedEvent.start.dateTime || selectedEvent.start.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-white/20 uppercase font-bold mb-1 tracking-widest">Hora</p>
                                    <p className="text-sm font-bold text-white/80">
                                        {new Date(selectedEvent.start.dateTime || selectedEvent.start.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {selectedEvent.metadata && (
                                <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5 space-y-4">
                                    <div>
                                        <p className="text-[10px] text-white/20 uppercase font-bold mb-1 tracking-widest">Cliente</p>
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-blue-400" />
                                            <p className="text-sm font-bold text-white/90">{selectedEvent.metadata.callerName}</p>
                                        </div>
                                    </div>

                                    {selectedEvent.metadata.callerPhone && (
                                        <div>
                                            <p className="text-[10px] text-white/20 uppercase font-bold mb-1 tracking-widest">Teléfono</p>
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-blue-400" />
                                                <p className="text-sm font-mono font-bold text-white/90">{selectedEvent.metadata.callerPhone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedEvent.metadata.notes && (
                                        <div>
                                            <p className="text-[10px] text-white/20 uppercase font-bold mb-1 tracking-widest">Notas</p>
                                            <p className="text-sm text-white/60 italic">"{selectedEvent.metadata.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!selectedEvent.metadata && (
                                <div className="p-5 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <p className="text-xs text-white/20 uppercase font-bold tracking-widest">Detalles externos (Google)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


function ConfigTab({ client, onUpdate }: { client: any, onUpdate: () => void }) {
    const [config, setConfig] = useState({
        agentName: client.agentName || "",
        agentTone: client.agentTone || "profesional",
        businessName: client.businessName || "",
        businessType: client.businessType || "",
        city: client.city || "",
        transferPhone: client.transferPhone || ""
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                body: JSON.stringify({
                    step: 1, // Step 1 handles business profile
                    data: {
                        businessName: config.businessName,
                        businessType: config.businessType,
                        city: config.city
                    }
                })
            });

            const res2 = await fetch('/api/onboarding', {
                method: 'POST',
                body: JSON.stringify({
                    step: 4, // Step 4 handles agent profile
                    data: {
                        agentName: config.agentName,
                        agentTone: config.agentTone,
                        transferPhone: config.transferPhone
                    }
                })
            });

            if (res.ok && res2.ok) {
                onUpdate();
                alert("Configuración guardada correctamente");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Header
                title="Configuración"
                subtitle="Personaliza los detalles de tu negocio y tu asistente IA."
                actions={
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-violet-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50">
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass rounded-3xl p-8 space-y-8">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <LayoutDashboard size={20} className="text-blue-400" /> Perfil del Negocio
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-2">Nombre del Negocio</label>
                            <input
                                value={config.businessName}
                                onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-white/30 block mb-2">Categoría</label>
                                <input
                                    value={config.businessType}
                                    onChange={(e) => setConfig({ ...config, businessType: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-white/30 block mb-2">Ciudad</label>
                                <input
                                    value={config.city}
                                    onChange={(e) => setConfig({ ...config, city: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold flex items-center gap-2 pt-4 border-t border-white/5">
                        <Brain size={20} className="text-blue-400" /> Identidad del Agente
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-2">Nombre del asistente</label>
                            <input
                                value={config.agentName}
                                onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-2">Tono de voz</label>
                            <div className="relative">
                                <select
                                    value={config.agentTone}
                                    onChange={(e) => setConfig({ ...config, agentTone: e.target.value as any })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none transition-all appearance-none"
                                >
                                    <option value="profesional" className="text-black">Profesional</option>
                                    <option value="cercano" className="text-black">Cercano</option>
                                </select>
                                <Settings size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                            </div>
                        </div>
                        <div className="pt-4">
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-2">Teléfono de desvío (Humano)</label>
                            <input
                                value={config.transferPhone}
                                onChange={(e) => setConfig({ ...config, transferPhone: e.target.value })}
                                placeholder="+34 600 000 000"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-600 outline-none transition-all font-mono"
                            />
                            <p className="text-[9px] text-white/20 mt-1 italic">Número al que se transferirá la llamada si el bot no puede ayudar.</p>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-3xl p-8 space-y-8">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Settings size={20} className="text-blue-400" /> Datos Técnicos
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-3 font-mono">Retell Agent ID</label>
                            <div className="flex items-center gap-3 bg-blue-400/5 p-4 rounded-xl border border-blue-400/10 group">
                                <code className="flex-1 text-xs text-blue-400 font-mono truncate">{client.retellAgentId || "No configurado"}</code>
                                <ExternalLink size={14} className="text-blue-400/40 group-hover:text-blue-400 transition-colors cursor-pointer" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-3 font-mono">Database Mode</label>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${client.databaseUrl ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]'}`} />
                                <span className="text-xs font-bold uppercase tracking-widest">{client.databaseUrl ? 'Isolated (Tenant)' : 'Shared (Master)'}</span>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold flex items-center gap-2 pt-4 border-t border-white/5">
                        <Activity size={20} className="text-blue-400" /> Integración Universal
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-white/30 block mb-2">Sincronización Móvil (iCal)</label>
                            <div
                                className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                                onClick={() => {
                                    const url = `${window.location.origin}/api/calendar/feed/${client.id}`;
                                    navigator.clipboard.writeText(url);
                                    alert("URL de iCal copiada al portapapeles. Pégala en tu calendario de iPhone/Google.");
                                }}
                            >
                                <code className="flex-1 text-[10px] text-white/40 truncate">Haz clic para copiar URL iCal</code>
                                <Calendar size={14} className="text-blue-400" />
                            </div>
                        </div>
                        <button
                            onClick={() => window.open(`/api/calendar/export?clientId=${client.id}`, '_blank')}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all"
                        >
                            <DollarSign size={14} /> Exportar todas las citas a Excel (CSV)
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

function CallsList({ logs }: { logs: any[] }) {
    if (logs.length === 0) {
        return (
            <div className="glass p-16 text-center rounded-[2rem] border-dashed border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white/10">
                    <Phone size={32} />
                </div>
                <p className="text-white/20 font-medium text-lg italic tracking-tight">Todavía no has recibido llamadas</p>
                <p className="text-white/10 text-sm mt-1">El historial aparecerá aquí automáticamente</p>
            </div>
        );
    }

    return (
        <div className="glass rounded-[2rem] overflow-hidden border-white/5 shadow-2xl">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-white/5 bg-white/2">
                        <th className="p-5 font-bold text-white/40 uppercase text-[10px] tracking-widest">Fecha & Hora</th>
                        <th className="p-5 font-bold text-white/40 uppercase text-[10px] tracking-widest">Cliente</th>
                        <th className="p-5 font-bold text-white/40 uppercase text-[10px] tracking-widest">Resultado</th>
                        <th className="p-5 font-bold text-white/40 uppercase text-[10px] tracking-widest text-right">Detalles</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {logs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="p-5">
                                <div className="flex flex-col">
                                    <span className="font-bold text-white/80">{new Date(log.createdAt).toLocaleDateString()}</span>
                                    <span className="text-[10px] text-white/30 uppercase mt-0.5">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </td>
                            <td className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
                                        <Phone size={14} />
                                    </div>
                                    <span className="font-mono font-bold tracking-tight">{log.callerNumber || 'Desconocido'}</span>
                                </div>
                            </td>
                            <td className="p-5">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.actionTaken === 'booked' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                    log.actionTaken === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                                        'bg-white/5 text-white/40 border border-white/5'
                                    }`}>
                                    {log.actionTaken || 'CONSULTA'}
                                </span>
                            </td>
                            <td className="p-5 text-right">
                                <button className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all group-hover:translate-x-1">
                                    <ChevronRight size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StatCard({ title, value, trend, icon }: { title: string, value: any, trend: string, icon: any }) {
    return (
        <div className="glass rounded-[2rem] p-7 border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/2 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-3 rounded-2xl bg-white/5 group-hover:scale-110 group-hover:bg-blue-600/20 transition-all duration-500">
                    {React.cloneElement(icon as React.ReactElement, { size: 24 })}
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest ${trend.startsWith('+') || trend === 'OK' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    {trend}
                </div>
            </div>
            <div className="relative z-10">
                <h3 className="text-white/40 text-[10px] uppercase font-black tracking-[0.15em] mb-2">{title}</h3>
                <p className="text-4xl font-black tracking-tight">{value}</p>
            </div>
        </div>
    );
}
