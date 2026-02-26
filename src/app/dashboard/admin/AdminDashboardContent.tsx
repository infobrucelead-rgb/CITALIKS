"use client";
import React from "react";
import {
    LayoutDashboard,
    Users,
    Phone,
    ShieldCheck,
    ChevronRight,
    ArrowLeft,
    Activity,
    Database,
    Calendar,
    Settings,
    Plus,
    Mail,
    Trash2,
    CheckCircle2,
    XCircle
} from "lucide-react";

export default function AdminDashboardContent({ clients: initialClients }: { clients: any[] }) {
    const [clients, setClients] = React.useState(initialClients);
    const [invitations, setInvitations] = React.useState<any[]>([]);
    const [activeTab, setActiveTab] = React.useState<'clients' | 'invitations'>('clients');

    const [selectedClient, setSelectedClient] = React.useState<any>(null);
    const [reportData, setReportData] = React.useState<any>(null);
    const [loadingReport, setLoadingReport] = React.useState(false);
    const [period, setPeriod] = React.useState('last_month');

    React.useEffect(() => {
        if (activeTab === 'invitations') {
            fetchInvitations();
        }
    }, [activeTab]);

    const fetchInvitations = async () => {
        try {
            const res = await fetch('/api/admin/invite');
            if (!res.ok) {
                const text = await res.text();
                console.error("Error fetching invitations:", res.status, text);
                return;
            }
            const data = await res.json();
            if (data.invitations) setInvitations(data.invitations);
        } catch (err) {
            console.error("Error fetching invitations:", err);
        }
    };

    const handleDeleteInvitation = async (invitationId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta invitación?")) return;

        try {
            const res = await fetch('/api/admin/invite', {
                method: 'DELETE',
                body: JSON.stringify({ invitationId })
            });
            if (res.ok) {
                fetchInvitations();
            }
        } catch (err) {
            console.error("Error deleting invitation:", err);
        }
    };

    const handleToggleStatus = async (clientId: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/admin/clients', {
                method: 'PATCH',
                body: JSON.stringify({ clientId, isActive: !currentStatus })
            });

            if (res.ok) {
                // Update local state
                setClients(prev => prev.map(c =>
                    c.id === clientId ? { ...c, isActive: !currentStatus } : c
                ));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteClient = async (clientId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este cliente por completo? Esta acción es irreversible y eliminará todos sus datos.")) return;

        try {
            const res = await fetch('/api/admin/clients', {
                method: 'DELETE',
                body: JSON.stringify({ clientId })
            });

            if (res.ok) {
                setClients(prev => prev.filter(c => c.id !== clientId));
            }
        } catch (err) {
            console.error("Error deleting client:", err);
        }
    };

    const handleUpdateClientField = async (clientId: string, updates: any) => {
        try {
            const res = await fetch('/api/admin/clients', {
                method: 'PATCH',
                body: JSON.stringify({ clientId, ...updates })
            });

            if (res.ok) {
                const data = await res.json();
                // Update local state for both clients list and selected client
                setClients(prev => prev.map(c =>
                    c.id === clientId ? { ...c, ...updates } : c
                ));
                if (selectedClient && selectedClient.id === clientId) {
                    setSelectedClient({ ...selectedClient, ...updates });
                }
            } else {
                alert("Error al actualizar el campo");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleInvite = async () => {
        const email = prompt("Email del cliente a invitar:");
        if (!email) return;
        const businessName = prompt("Nombre del negocio:");

        try {
            const res = await fetch('/api/admin/invite', {
                method: 'POST',
                body: JSON.stringify({ email, businessName })
            });
            if (res.ok) {
                const data = await res.json();
                alert(`Invitación generada y enviada correctamente a: ${email}`);
                if (fetchInvitations) fetchInvitations();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReport = async () => {
        if (!selectedClient) return;
        setLoadingReport(true);
        try {
            const res = await fetch('/api/admin/reports', {
                method: 'POST',
                body: JSON.stringify({
                    clientId: selectedClient.id,
                    ...getPeriodDates(period)
                })
            });
            const data = await res.json();
            if (data.success) {
                setReportData(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingReport(false);
        }
    };

    const getPeriodDates = (p: string) => {
        const now = new Date();
        if (p === 'last_month') {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
        }
        if (p === 'last_quarter') {
            const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
        }
        return {};
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-10">
            {/* Header */}
            <header className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => window.location.href = "/dashboard"}
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black mb-1">Panel de Control <span className="text-blue-500">Master</span></h1>
                        <p className="text-white/40 uppercase text-[10px] font-black tracking-[0.2em]">Platform Administration • Super Admin View</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleInvite}
                        className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-3 font-bold text-sm">
                        <Plus size={20} /> Invitar Cliente
                    </button>
                    <div className="px-6 py-3 rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/20 flex items-center gap-3">
                        <ShieldCheck size={20} />
                        <span className="font-bold text-sm">Administrador Maestro</span>
                    </div>
                </div>
            </header>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <MetricCard title="Clientes Totales" value={clients.length} icon={<Users className="text-blue-400" />} />
                <MetricCard title="Negocios Activos" value={clients.filter(c => c.isActive).length} icon={<Activity className="text-emerald-400" />} />
                <MetricCard title="Llamadas Globales" value={clients.reduce((acc, c) => acc + (c._count?.callLogs || 0), 0)} icon={<Phone className="text-blue-400" />} />
                <MetricCard title="Base de Datos" value="Multi-Tenant" icon={<Database className="text-amber-400" />} />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-white/5">
                <button
                    onClick={() => setActiveTab("clients")}
                    className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === "clients" ? "text-blue-500 border-b-2 border-blue-500" : "text-white/40 hover:text-white"}`}>
                    Negocios Activos
                </button>
                <button
                    onClick={() => setActiveTab("invitations")}
                    className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === "invitations" ? "text-blue-500 border-b-2 border-blue-500" : "text-white/40 hover:text-white"}`}>
                    Invitaciones Enviadas
                </button>
            </div>

            {activeTab === "clients" ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Listado de Negocios</h2>
                        <div className="flex gap-3">
                            <input
                                placeholder="Buscar negocio o email..."
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-blue-600 outline-none w-64"
                            />
                        </div>
                    </div>

                    <div className="glass rounded-[2rem] overflow-hidden border-white/5 shadow-2xl">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/2">
                                    <th className="p-6 font-bold text-white/40 uppercase text-[10px] tracking-widest">Negocio</th>
                                    <th className="p-6 font-bold text-white/40 uppercase text-[10px] tracking-widest text-center">Teléfono Bot</th>
                                    <th className="p-6 font-bold text-white/40 uppercase text-[10px] tracking-widest text-center">Actividad</th>
                                    <th className="p-6 font-bold text-white/40 uppercase text-[10px] tracking-widest">Infraestructura</th>
                                    <th className="p-6 font-bold text-white/40 uppercase text-[10px] tracking-widest text-right">Estado / Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-600/20 flex items-center justify-center font-bold text-blue-400 border border-blue-500/10">
                                                    {client.businessName?.[0] || 'B'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base">{client.businessName || "Sin nombre"}</p>
                                                    <p className="text-[10px] text-white/30 truncate w-48 font-mono">{client.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            {client.phone ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-400 font-mono text-sm font-bold">
                                                    <Phone size={14} />
                                                    {client.phone}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">No asignado</span>
                                            )}
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex items-center justify-center gap-6">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black text-lg">{client._count?.callLogs || 0}</span>
                                                    <span className="text-[9px] text-white/20 uppercase font-black uppercase tracking-tighter">Calls</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black text-lg">{client._count?.staff || 0}</span>
                                                    <span className="text-[9px] text-white/20 uppercase font-black uppercase tracking-tighter">Team</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black text-lg">{client._count?.services || 0}</span>
                                                    <span className="text-[9px] text-white/20 uppercase font-black uppercase tracking-tighter">Services</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${client.databaseUrl ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]'}`} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{client.databaseUrl ? 'Dedicated (AWS)' : 'Shared (MASTER)'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${client.retellAgentId ? 'bg-blue-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]' : 'bg-red-400'}`} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{client.retellAgentId ? 'Agent Linked' : 'No Agent'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleToggleStatus(client.id, client.isActive)}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border shrink-0 transition-all active:scale-95 ${client.isActive
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                                        : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                                        }`}>
                                                    {client.isActive ? 'Active' : 'Suspended'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClient(client.id)}
                                                    className="p-2 text-white/10 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                                    title="Eliminar cliente">
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedClient(client);
                                                        setReportData(null);
                                                    }}
                                                    className="p-2 text-white/10 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                                                    title="Ver detalles e informes">
                                                    <LayoutDashboard size={18} />
                                                </button>
                                                <button className="p-2 text-white/10 hover:text-white hover:bg-white/5 rounded-xl transition-all group-hover:translate-x-1">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {selectedClient && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
                            <div className="bg-[#0f0f15] w-full max-w-5xl max-h-[90vh] rounded-[3rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden">
                                {/* Detail Header */}
                                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[2rem] bg-blue-600/20 flex items-center justify-center text-3xl font-black text-blue-400 border border-blue-600/20">
                                            {selectedClient.businessName?.[0] || 'B'}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black">{selectedClient.businessName}</h2>
                                            <p className="text-white/40 font-mono text-xs">{selectedClient.id}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedClient(null)}
                                        className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <XCircle size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                    {/* Config Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="glass p-6 rounded-3xl border-white/5 group relative">
                                            <p className="text-[10px] uppercase font-black text-white/20 tracking-widest mb-4">Teléfono Bot</p>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xl font-bold">{selectedClient.phone || "No configurado"}</p>
                                                <button
                                                    onClick={() => {
                                                        const val = prompt("Nuevo Teléfono Bot:", selectedClient.phone || "");
                                                        if (val !== null) handleUpdateClientField(selectedClient.id, { phone: val });
                                                    }}
                                                    className="p-2 opacity-0 group-hover:opacity-100 transition-all text-blue-400 hover:bg-blue-400/10 rounded-lg">
                                                    <Settings size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="glass p-6 rounded-3xl border-white/5 group relative">
                                            <p className="text-[10px] uppercase font-black text-white/20 tracking-widest mb-4">Teléfono Desvío</p>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xl font-bold">{selectedClient.transferPhone || "No configurado"}</p>
                                                <button
                                                    onClick={() => {
                                                        const val = prompt("Nuevo Teléfono Desvío:", selectedClient.transferPhone || "");
                                                        if (val !== null) handleUpdateClientField(selectedClient.id, { transferPhone: val });
                                                    }}
                                                    className="p-2 opacity-0 group-hover:opacity-100 transition-all text-violet-400 hover:bg-violet-400/10 rounded-lg">
                                                    <Settings size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="glass p-6 rounded-3xl border-white/5">
                                            <p className="text-[10px] uppercase font-black text-white/20 tracking-widest mb-4">Calendario Principal</p>
                                            <p className="text-xs font-mono break-all">{selectedClient.calendarId || "primary"}</p>
                                        </div>
                                    </div>

                                    {/* Reporting Section */}
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                            <div>
                                                <h3 className="text-xl font-bold">Informe de Actividad</h3>
                                                <p className="text-xs text-white/40 uppercase font-black tracking-widest mt-1">Tarificación y Análisis</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {['last_month', 'last_quarter', 'custom'].map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setPeriod(p)}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${period === p ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                                                        {p === 'last_month' ? 'Último Mes' : p === 'last_quarter' ? 'Trimestre' : 'Personalizado'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {loadingReport ? (
                                            <div className="h-48 flex items-center justify-center">
                                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : reportData ? (
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="bg-white/2 p-6 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] uppercase font-black text-white/20 mb-2">Total Llamadas</p>
                                                    <p className="text-3xl font-black">{reportData.summary.totalCalls}</p>
                                                </div>
                                                <div className="bg-white/2 p-6 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] uppercase font-black text-white/20 mb-2">Tiempo Total</p>
                                                    <p className="text-3xl font-black">{Math.round(reportData.summary.totalDurationSec / 60)} min</p>
                                                </div>
                                                <div className="bg-white/2 p-6 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] uppercase font-black text-white/20 mb-2">Reservas Exitosas</p>
                                                    <p className="text-3xl font-black text-emerald-400">{reportData.summary.bookedCount}</p>
                                                </div>
                                                <div className="bg-white/2 p-6 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] uppercase font-black text-white/20 mb-2">Promedio Llamada</p>
                                                    <p className="text-3xl font-black">{reportData.summary.averageDurationSec}s</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-48 flex items-center justify-center text-white/20 italic">
                                                No hay datos para este periodo
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Logs Mini Table */}
                                    {reportData?.logs && (
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">Últimos Registros</h4>
                                            <div className="bg-white/[0.02] rounded-[2rem] border border-white/5 overflow-hidden">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="bg-white/5 border-b border-white/5">
                                                            <th className="p-4 uppercase font-black text-[9px]">Fecha</th>
                                                            <th className="p-4 uppercase font-black text-[9px]">Acción</th>
                                                            <th className="p-4 uppercase font-black text-[9px]">Resumen</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {reportData.logs.slice(0, 10).map((log: any) => (
                                                            <tr key={log.id} className="hover:bg-white/5">
                                                                <td className="p-4 text-white/40 font-mono">{new Date(log.createdAt).toLocaleDateString()}</td>
                                                                <td className="p-4">
                                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${log.actionTaken === 'booked' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                                        {log.actionTaken}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 font-medium">{log.summary}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Historial de Invitaciones</h2>
                        <button
                            onClick={fetchInvitations}
                            className="p-2 text-white/40 hover:text-white transition-colors">
                            <Activity size={16} />
                        </button>
                    </div>

                    <div className="glass rounded-[2rem] overflow-hidden border-white/5 shadow-2xl">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/2">
                                    <th className="p-6 font-bold text-white/40 uppercase text-[10px] tracking-widest">Email Destino</th>
                                    <th className="p-6 font-bold text-white/40 uppercase text-[10px] tracking-widest">Negocio</th>
                                    <th className="p-6 font-bold text-white/40 uppercase text-[10px] tracking-widest">Fecha</th>
                                    <th className="p-6 font-bold text-white/40 uppercase text-[10px] tracking-widest text-right">Estado</th>
                                    <th className="p-6 font-bold text-white/40 uppercase text-[10px] tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {invitations.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-white/20 italic">No hay invitaciones registradas</td>
                                    </tr>
                                ) : (
                                    invitations.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-6 font-medium">{inv.email}</td>
                                            <td className="p-6 font-bold text-violet-400">{inv.businessName || "N/A"}</td>
                                            <td className="p-6 text-white/40">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                            <td className="p-6 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${inv.status === 'ACCEPTED'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                    {inv.status === 'PENDING' ? 'Pendiente' : 'Aceptada'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button
                                                    onClick={() => handleDeleteInvitation(inv.id)}
                                                    className="p-2 text-white/10 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                                    title="Eliminar invitación">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div >
    );
}

function MetricCard({ title, value, icon }: { title: string, value: any, icon: any }) {
    return (
        <div className="glass rounded-[2rem] p-8 border-white/5 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/[0.02] rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:bg-violet-600/[0.05] transition-colors"></div>
            <div className="p-3 rounded-2xl bg-white/5 w-fit mb-6 group-hover:scale-110 group-hover:bg-violet-600/20 transition-all duration-500">
                {React.cloneElement(icon as React.ReactElement, { size: 24 })}
            </div>
            <h3 className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em] mb-2">{title}</h3>
            <p className="text-4xl font-black tracking-tight">{value}</p>
        </div>
    );
}
