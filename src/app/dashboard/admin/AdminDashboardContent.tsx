"use client";
import React from "react";
import {
    LayoutDashboard, Users, Phone, ShieldCheck, ChevronRight, ArrowLeft,
    Activity, Database, Calendar, Settings, Plus, Mail, Trash2,
    CheckCircle2, XCircle, Search, RefreshCw, Edit2, Save, X,
    MessageSquare, Clock, TrendingUp, AlertCircle, Copy, ExternalLink,
    ChevronLeft, ChevronDown, Bot, Zap, CalendarX, CalendarCheck,
    Brain, LifeBuoy
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = "clients" | "prospects" | "invitations" | "appointments" | "settings" | "tickets";
type ClientDetailTab = "info" | "activity" | "appointments" | "subscription";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboardContent({ clients: initialClients, admin: initialAdmin }: { clients: any[], admin: any }) {
    const [clients, setClients] = React.useState(initialClients);
    const [admin, setAdmin] = React.useState(initialAdmin);
    const [invitations, setInvitations] = React.useState<any[]>([]);
    const [prospects, setProspects] = React.useState<any[]>([]);
    const [loadingProspects, setLoadingProspects] = React.useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
    const [inviteForm, setInviteForm] = React.useState({
        email: "",
        name: "",
        phone: "",
        plan: "biannual",
        notes: "",
        type: "stripe" as "stripe" | "free"
    });
    const [sendingInvite, setSendingInvite] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<TabType>("clients");
    const [selectedClient, setSelectedClient] = React.useState<any>(null);
    const [clientDetailTab, setClientDetailTab] = React.useState<ClientDetailTab>("info");
    const [reportData, setReportData] = React.useState<any>(null);
    const [loadingReport, setLoadingReport] = React.useState(false);
    const [period, setPeriod] = React.useState("last_month");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [currentPage, setCurrentPage] = React.useState(1);
    const [editingField, setEditingField] = React.useState<string | null>(null);
    const [editValue, setEditValue] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const [toast, setToast] = React.useState<{ msg: string; type: "ok" | "err" } | null>(null);
    const [updatingAgent, setUpdatingAgent] = React.useState(false);
    const [appointments, setAppointments] = React.useState<any[]>([]);
    const [loadingAppointments, setLoadingAppointments] = React.useState(false);
    const [appointmentFilter, setAppointmentFilter] = React.useState("all");
    const [selectedClientFilter, setSelectedClientFilter] = React.useState("all");
    const [creatingCheckout, setCreatingCheckout] = React.useState(false);
    const [openingPortal, setOpeningPortal] = React.useState(false);
    const [testingEmail, setTestingEmail] = React.useState(false);
    const [tickets, setTickets] = React.useState<any[]>([]);
    const [loadingTickets, setLoadingTickets] = React.useState(false);

    const PAGE_SIZE = 10;

    // ── Helpers ──────────────────────────────────────────────────────────────
    const showToast = (msg: string, type: "ok" | "err" = "ok") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const filteredClients = React.useMemo(() => {
        const q = searchQuery.toLowerCase();
        return clients.filter(c =>
            (c.businessName || "").toLowerCase().includes(q) ||
            (c.email || "").toLowerCase().includes(q) ||
            (c.phone || "").toLowerCase().includes(q)
        );
    }, [clients, searchQuery]);

    const paginatedClients = React.useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredClients.slice(start, start + PAGE_SIZE);
    }, [filteredClients, currentPage]);

    const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE);

    // ── Data fetching ─────────────────────────────────────────────────────────
    React.useEffect(() => {
        if (activeTab === "invitations") fetchInvitations();
        if (activeTab === "prospects") fetchProspects();
        if (activeTab === "appointments") fetchAllAppointments();
        if (activeTab === "tickets") fetchTickets();
    }, [activeTab]);

    const fetchInvitations = async () => {
        try {
            const res = await fetch("/api/admin/invite");
            if (!res.ok) return;
            const data = await res.json();
            if (data.invitations) setInvitations(data.invitations);
        } catch (err) {
            console.error("Error fetching invitations:", err);
        }
    };

    const fetchProspects = async () => {
        setLoadingProspects(true);
        try {
            const res = await fetch("/api/admin/send-payment-link");
            if (!res.ok) return;
            const data = await res.json();
            if (data.prospects) setProspects(data.prospects);
        } catch (err) {
            console.error("Error fetching prospects:", err);
        } finally {
            setLoadingProspects(false);
        }
    };

    const fetchAllAppointments = async () => {
        setLoadingAppointments(true);
        try {
            const res = await fetch("/api/admin/appointments");
            if (!res.ok) return;
            const data = await res.json();
            if (data.appointments) setAppointments(data.appointments);
        } catch (err) {
            console.error("Error fetching appointments:", err);
        } finally {
            setLoadingAppointments(false);
        }
    };

    const fetchClientAppointments = async (clientId: string) => {
        setLoadingAppointments(true);
        try {
            const res = await fetch(`/api/admin/appointments?clientId=${clientId}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.appointments) setAppointments(data.appointments);
        } catch (err) {
            console.error("Error fetching client appointments:", err);
        } finally {
            setLoadingAppointments(false);
        }
    };

    const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
            const res = await fetch("/api/admin/tickets");
            if (!res.ok) return;
            const data = await res.json();
            if (data.tickets) setTickets(data.tickets);
        } catch (err) {
            console.error("Error fetching tickets:", err);
        } finally {
            setLoadingTickets(false);
        }
    };

    const handleUpdateTicket = async (ticketId: string, updates: any) => {
        try {
            const res = await fetch(`/api/admin/tickets/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
                showToast("Ticket actualizado");
            } else {
                showToast("Error al actualizar ticket", "err");
            }
        } catch (err) {
            showToast("Error de conexión", "err");
        }
    };

    const fetchReport = async () => {
        if (!selectedClient) return;
        setLoadingReport(true);
        try {
            const res = await fetch("/api/admin/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientId: selectedClient.id, ...getPeriodDates(period) })
            });
            const data = await res.json();
            if (data.success) setReportData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingReport(false);
        }
    };

    React.useEffect(() => {
        if (selectedClient && clientDetailTab === "activity") fetchReport();
        if (selectedClient && clientDetailTab === "appointments") fetchClientAppointments(selectedClient.id);
    }, [selectedClient, clientDetailTab, period]);

    const getPeriodDates = (p: string) => {
        const now = new Date();
        if (p === "last_month") {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
        }
        if (p === "last_quarter") {
            const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
        }
        return {};
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleToggleStatus = async (clientId: string, currentStatus: boolean) => {
        try {
            const res = await fetch("/api/admin/clients", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientId, isActive: !currentStatus })
            });
            if (res.ok) {
                setClients(prev => prev.map(c => c.id === clientId ? { ...c, isActive: !currentStatus } : c));
                if (selectedClient?.id === clientId) setSelectedClient((s: any) => ({ ...s, isActive: !currentStatus }));
                showToast(!currentStatus ? "Cliente activado" : "Cliente suspendido");
            }
        } catch (err) {
            showToast("Error al cambiar estado", "err");
        }
    };

    const handleDeleteClient = async (clientId: string) => {
        if (!confirm("¿Eliminar este cliente? Esta acción es irreversible y borrará todos sus datos.")) return;
        try {
            const res = await fetch("/api/admin/clients", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientId })
            });
            if (res.ok) {
                setClients(prev => prev.filter(c => c.id !== clientId));
                if (selectedClient?.id === clientId) setSelectedClient(null);
                showToast("Cliente eliminado");
            }
        } catch (err) {
            showToast("Error al eliminar", "err");
        }
    };

    const handleSaveField = async (field: string, value: string) => {
        if (!selectedClient) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/clients", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientId: selectedClient.id, [field]: value })
            });
            const data = await res.json();
            if (res.ok) {
                setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, [field]: value } : c));
                setSelectedClient((s: any) => ({ ...s, [field]: value }));
                setEditingField(null);
                if (data.warning) {
                    showToast(`Guardado. Retell: ${data.warning}`, "err");
                } else {
                    showToast("Campo actualizado correctamente");
                }
            } else {
                showToast(data.error || "Error al guardar", "err");
            }
        } catch (err) {
            showToast("Error de conexión", "err");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateAgent = async (clientId: string) => {
        setUpdatingAgent(true);
        try {
            const res = await fetch(`/api/admin/update-agent`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientId })
            });
            const data = await res.json();
            if (res.ok) {
                showToast("Agente de Retell actualizado correctamente");
            } else {
                showToast(data.error || "Error al actualizar agente", "err");
            }
        } catch (err) {
            showToast("Error de conexión", "err");
        } finally {
            setUpdatingAgent(false);
        }
    };

    const handleCreateCheckout = async (clientId: string, plan: string) => {
        setCreatingCheckout(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetClientId: clientId, plan })
            });
            const data = await res.json();
            if (res.ok && data.url) {
                if (data.sent) {
                    showToast("Enlace enviado al cliente por Email y SMS");
                }
                window.open(data.url, "_blank");
            } else {
                showToast(data.error || "Error al crear sesión de pago", "err");
            }
        } catch (err) {
            showToast("Error de conexión", "err");
        } finally {
            setCreatingCheckout(false);
        }
    };

    const handleOpenPortal = async (clientId: string) => {
        setOpeningPortal(true);
        try {
            const res = await fetch("/api/stripe/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetClientId: clientId })
            });
            const data = await res.json();
            if (res.ok && data.url) {
                window.open(data.url, "_blank");
            } else {
                showToast(data.error || "Error al abrir portal de facturación", "err");
            }
        } catch (err) {
            showToast("Error de conexión", "err");
        } finally {
            setOpeningPortal(false);
        }
    };

    const handleCancelAppointment = async (appointmentId: string) => {
        if (!confirm("¿Cancelar esta cita?")) return;
        try {
            const res = await fetch("/api/admin/appointments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointmentId, status: "CANCELLED" })
            });
            if (res.ok) {
                setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: "CANCELLED" } : a));
                showToast("Cita cancelada");
            }
        } catch (err) {
            showToast("Error al cancelar cita", "err");
        }
    };

    const handleDeleteInvitation = async (invitationId: string) => {
        if (!confirm("¿Eliminar esta invitación?")) return;
        try {
            const res = await fetch("/api/admin/invite", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invitationId })
            });
            if (res.ok) {
                fetchInvitations();
                showToast("Invitación eliminada");
            }
        } catch (err) {
            showToast("Error al eliminar", "err");
        }
    };

    const handleDeleteProspect = async (prospectId: string) => {
        if (!confirm("¿Eliminar este prospecto?")) return;
        try {
            const res = await fetch("/api/admin/send-payment-link", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prospectId })
            });
            if (res.ok) {
                fetchProspects();
                showToast("Prospecto eliminado");
            }
        } catch (err) {
            showToast("Error al eliminar", "err");
        }
    };

    const handleSendInviteLink = async () => {
        setSendingInvite(true);
        try {
            const isFree = inviteForm.type === "free";
            const endpoint = isFree ? "/api/admin/invite" : "/api/admin/send-payment-link";
            const body = isFree
                ? { email: inviteForm.email, businessName: inviteForm.name }
                : inviteForm;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (res.ok) {
                showToast(isFree ? "Invitación gratuita enviada (Pase VIP)" : "Invitación y enlace de pago enviados correctamente");
                setIsInviteModalOpen(false);
                setInviteForm({ email: "", name: "", phone: "", plan: "biannual", notes: "", type: "stripe" });
                if (activeTab === "prospects") fetchProspects();
                if (activeTab === "invitations") fetchInvitations();
            } else {
                showToast(data.error || "Error al enviar", "err");
            }
        } catch (err) {
            showToast("Error de conexión", "err");
        } finally {
            setSendingInvite(false);
        }
    };

    const handleTestEmail = async () => {
        setTestingEmail(true);
        try {
            const res = await fetch("/api/admin/diag/test-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteForm.email })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast("Correo de prueba enviado correctamente");
            } else {
                showToast(data.error || "Error al probar SMTP", "err");
            }
        } catch (err) {
            showToast("Error de conexión al probar SMTP", "err");
        } finally {
            setTestingEmail(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("Copiado al portapapeles");
    };

    const handleSaveAdminField = async (field: string, value: string) => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value })
            });
            if (res.ok) {
                setAdmin((prev: any) => ({ ...prev, [field]: value }));
                setEditingField(null);
                showToast("Configuración global actualizada");
            } else {
                const data = await res.json();
                showToast(data.error || "Error al guardar", "err");
            }
        } catch (err) {
            showToast("Error de conexión", "err");
        } finally {
            setSaving(false);
        }
    };

    const handleTestSms = async (phone: string) => {
        if (!phone) return showToast("Configura un teléfono primero", "err");
        try {
            const res = await fetch("/api/admin/diag/test-sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast("SMS de prueba enviado!");
            } else {
                showToast(data.error || "Error al enviar SMS", "err");
            }
        } catch (err) {
            showToast("Error de conexión al enviar SMS", "err");
        }
    };

    // ── Metrics ───────────────────────────────────────────────────────────────
    const totalCalls = clients.reduce((acc, c) => acc + (c._count?.callLogs || 0), 0);
    const activeCount = clients.filter(c => c.isActive).length;
    const withAgent = clients.filter(c => c.retellAgentId).length;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm transition-all ${toast.type === "ok" ? "bg-emerald-600" : "bg-red-600"}`}>
                    {toast.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {toast.msg}
                </div>
            )}

            <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:justify-between items-center md:items-center gap-6 md:gap-4 mb-6 md:mb-10 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
                        <button onClick={() => window.location.href = "/dashboard"} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors shrink-0">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black mb-0.5">Panel <span className="text-blue-500">Master</span></h1>
                            <p className="text-white/30 uppercase text-[9px] md:text-[10px] font-black tracking-[0.2em]">Platform Administration · Super Admin</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                        <button onClick={() => setIsInviteModalOpen(true)} className="w-full md:w-auto px-5 py-3 md:py-2.5 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 font-bold text-sm">
                            <Plus size={16} /> <span>Invitación VIP / Pago</span>
                        </button>
                    </div>
                </header>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <MetricCard title="Clientes" value={clients.length} sub={`${activeCount} activos`} icon={<Users size={20} className="text-blue-400" />} color="blue" />
                    <MetricCard title="Llamadas" value={totalCalls} sub="total cuentas" icon={<Phone size={20} className="text-emerald-400" />} color="emerald" />
                    <MetricCard title="Agentes" value={withAgent} sub={`${clients.length - withAgent} libres`} icon={<Bot size={20} className="text-violet-400" />} color="violet" />
                    <MetricCard title="Tenant" value="Active" sub="multi-db" icon={<Database size={20} className="text-amber-400" />} color="amber" />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-white/[0.03] p-1 rounded-2xl w-full md:w-fit border border-white/5 overflow-x-auto sticky top-0 md:static z-20 backdrop-blur-md custom-scrollbar shrink-0">
                    {(["clients", "prospects", "invitations", "appointments", "tickets", "settings"] as TabType[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 sm:px-5 py-2.5 rounded-xl text-[11px] sm:text-sm whitespace-nowrap font-bold transition-all ${activeTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/40 hover:text-white"}`}>
                            {tab === "clients" ? "Negocios" : tab === "prospects" ? "Leads" : tab === "invitations" ? "Invitaciones" : tab === "appointments" ? "Citas" : tab === "tickets" ? "Tickets" : "Configuración"}
                        </button>
                    ))}
                </div>

                {/* ── Tab: Clients ─────────────────────────────────────────── */}
                {activeTab === "clients" && (
                    <div className="space-y-4">
                        {/* Search + count */}
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    placeholder="Buscar negocio, email o teléfono..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-600 outline-none placeholder:text-white/20"
                                />
                            </div>
                            <span className="text-white/30 text-sm font-bold">{filteredClients.length} resultado{filteredClients.length !== 1 ? "s" : ""}</span>
                        </div>

                        {/* Table */}
                        {/* Desktop Table */}
                        <div className="hidden md:block rounded-[1.5rem] overflow-x-auto border border-white/5 bg-white/[0.02] custom-scrollbar">
                            <table className="w-full text-left text-sm min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest">Negocio</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest">Teléfono Bot</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest text-center">Actividad</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest">Infraestructura</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginatedClients.length === 0 ? (
                                        <tr><td colSpan={5} className="p-10 text-center text-white/20 italic">No se encontraron negocios</td></tr>
                                    ) : paginatedClients.map(client => (
                                        <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${client.isActive ? "bg-blue-600/20 text-blue-400 border-blue-600/20" : "bg-white/5 text-white/30 border-white/10"}`}>
                                                        {(client.businessName || "B")[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{client.businessName || "Sin nombre"}</p>
                                                        <p className="text-[10px] text-white/30 font-mono truncate max-w-[180px]">{client.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                {client.phone ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/10 border border-blue-600/20 text-blue-400 font-mono text-xs font-bold">
                                                        <Phone size={11} />{client.phone}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Sin asignar</span>
                                                )}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center justify-center gap-5">
                                                    <Stat label="Calls" value={client._count?.callLogs || 0} />
                                                    <Stat label="Team" value={client._count?.staff || 0} />
                                                    <Stat label="Svcs" value={client._count?.services || 0} />
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="space-y-1.5">
                                                    <InfraTag active={!!client.databaseUrl} label={client.databaseUrl ? "Dedicated DB" : "Shared DB"} />
                                                    <InfraTag active={!!client.retellAgentId} label={client.retellAgentId ? "Agent Linked" : "No Agent"} />
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleToggleStatus(client.id, client.isActive)}
                                                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${client.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"}`}>
                                                        {client.isActive ? "Activo" : "Suspendido"}
                                                    </button>
                                                    <button onClick={() => handleDeleteClient(client.id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Eliminar">
                                                        <Trash2 size={15} />
                                                    </button>
                                                    <button onClick={() => { setSelectedClient(client); setClientDetailTab("info"); setReportData(null); setAppointments([]); }}
                                                        className="p-2 text-white/20 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all" title="Ver detalles">
                                                        <LayoutDashboard size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden space-y-3">
                            {paginatedClients.length === 0 ? (
                                <div className="p-10 text-center text-white/20 italic">No se encontraron negocios</div>
                            ) : paginatedClients.map(client => (
                                <div key={client.id} className="glass p-4 rounded-2xl border-white/5 bg-white/[0.02] space-y-4">
                                    <div className="flex items-start justify-between gap-3 overflow-hidden">
                                        <div className="flex-1 flex items-center gap-3 min-w-0">
                                            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${client.isActive ? "bg-blue-600/20 text-blue-400 border-blue-600/20" : "bg-white/5 text-white/30 border-white/10"}`}>
                                                {(client.businessName || "B")[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">{client.businessName || "Sin nombre"}</p>
                                                <p className="text-[10px] text-white/30 truncate">{client.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1 mt-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${client.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                                                {client.isActive ? "ACTIVO" : "OFF"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] uppercase font-black text-white/20 tracking-tighter">Calls</span>
                                            <span className="font-bold text-blue-400">{client._count?.callLogs || 0}</span>
                                        </div>
                                        <div className="w-px h-6 bg-white/5"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] uppercase font-black text-white/20 tracking-tighter">Team</span>
                                            <span className="font-bold text-white/80">{client._count?.staff || 0}</span>
                                        </div>
                                        <div className="w-px h-6 bg-white/5"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] uppercase font-black text-white/20 tracking-tighter">Svcs</span>
                                            <span className="font-bold text-white/80">{client._count?.services || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 pt-2">
                                        <button onClick={() => { setSelectedClient(client); setClientDetailTab("info"); setReportData(null); setAppointments([]); }}
                                            className="flex-1 py-3.5 rounded-2xl bg-blue-600/10 text-blue-400 text-[10px] font-black uppercase border border-blue-600/20 tracking-wider active:scale-95 transition-all">
                                            Detalles
                                        </button>
                                        <button onClick={() => handleToggleStatus(client.id, client.isActive)}
                                            className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase border active:scale-95 transition-all ${client.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                                            {client.isActive ? "Activo" : "Suspendido"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-white/30 text-xs">Página {currentPage} de {totalPages}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab: Prospects (Leads) ─────────────────────────────────── */}
                {activeTab === "prospects" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold">Leads y Enlaces de Pago</h2>
                            <button onClick={fetchProspects} className="p-2 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                                <RefreshCw size={16} className={loadingProspects ? "animate-spin" : ""} />
                            </button>
                        </div>
                        {/* Desktop Table */}
                        <div className="hidden md:block rounded-[1.5rem] overflow-x-auto border border-white/5 bg-white/[0.02] custom-scrollbar">
                            <table className="w-full text-left text-sm min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest">Prospecto</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest">Plan</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest text-center">Estado</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest">Último Envío</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {prospects.length === 0 ? (
                                        <tr><td colSpan={5} className="p-10 text-center text-white/20 italic">No hay prospectos registrados</td></tr>
                                    ) : prospects.map(prospect => (
                                        <tr key={prospect.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-5">
                                                <p className="font-bold">{prospect.name}</p>
                                                <p className="text-[10px] text-white/40 font-mono">{prospect.email}</p>
                                            </td>
                                            <td className="p-5">
                                                <span className="px-2 py-1 rounded-md bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[10px] font-black uppercase">
                                                    {prospect.plan}
                                                </span>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${prospect.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : prospect.status === "expired" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-white/5 text-white/40 border border-white/10"}`}>
                                                        {prospect.status === "paid" ? "Pagado" : prospect.status === "expired" ? "Expirado" : "Pendiente"}
                                                    </span>
                                                    {prospect.status === "pending" && (
                                                        <div className="flex gap-1">
                                                            <span title="24h" className={`w-1.5 h-1.5 rounded-full ${prospect.reminder24hSentAt ? "bg-blue-400" : "bg-white/10"}`} />
                                                            <span title="3d" className={`w-1.5 h-1.5 rounded-full ${prospect.reminder3dSentAt ? "bg-amber-400" : "bg-white/10"}`} />
                                                            <span title="7d" className={`w-1.5 h-1.5 rounded-full ${prospect.reminder7dSentAt ? "bg-red-400" : "bg-white/10"}`} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-white/40 text-xs">
                                                {prospect.paymentLinkSentAt ? new Date(prospect.paymentLinkSentAt).toLocaleString("es-ES") : "Nunca"}
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => {
                                                        setInviteForm({
                                                            email: prospect.email,
                                                            name: prospect.name,
                                                            phone: prospect.phone || "",
                                                            plan: prospect.plan || "biannual",
                                                            notes: prospect.notes || "",
                                                            type: "stripe"
                                                        });
                                                        setIsInviteModalOpen(true);
                                                    }} className="p-2 text-white/20 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all" title="Reenviar o Editar">
                                                        <Mail size={15} />
                                                    </button>
                                                    <button onClick={() => handleDeleteProspect(prospect.id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Eliminar">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List */}
                        <div className="md:hidden space-y-3">
                            {prospects.length === 0 ? (
                                <div className="p-10 text-center text-white/20 italic">No hay prospectos</div>
                            ) : prospects.map(prospect => (
                                <div key={prospect.id} className="glass p-4 rounded-2xl border-white/5 bg-white/[0.02] space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{prospect.name}</p>
                                            <p className="text-[10px] text-white/30 font-mono truncate max-w-[200px]">{prospect.email}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${prospect.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : prospect.status === "expired" ? "bg-red-500/10 text-red-500 border border-red-500/10" : "bg-white/5 text-white/40 border border-white/10"}`}>
                                                {prospect.status === "paid" ? "OK" : prospect.status === "expired" ? "EXP" : "OFF"}
                                            </span>
                                            {prospect.status === "pending" && (
                                                <div className="flex gap-1">
                                                    <span className={`w-1 h-1 rounded-full ${prospect.reminder24hSentAt ? "bg-blue-400" : "bg-white/10"}`} />
                                                    <span className={`w-1 h-1 rounded-full ${prospect.reminder3dSentAt ? "bg-amber-400" : "bg-white/10"}`} />
                                                    <span className={`w-1 h-1 rounded-full ${prospect.reminder7dSentAt ? "bg-red-400" : "bg-white/10"}`} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <span className="px-2 py-1 rounded-md bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[10px] font-black uppercase">
                                            {prospect.plan}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => {
                                                setInviteForm({
                                                    email: prospect.email,
                                                    name: prospect.name,
                                                    phone: prospect.phone || "",
                                                    plan: prospect.plan || "biannual",
                                                    notes: prospect.notes || "",
                                                    type: "stripe"
                                                });
                                                setIsInviteModalOpen(true);
                                            }} className="p-2 text-blue-400 bg-blue-400/10 rounded-xl">
                                                <Mail size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteProspect(prospect.id)} className="p-2 text-red-400 bg-red-400/10 rounded-xl">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Tab: Invitations ─────────────────────────────────────── */}
                {activeTab === "invitations" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold">Historial de Invitaciones</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleTestEmail}
                                    disabled={testingEmail}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                                    title="Envía un correo de prueba para verificar la configuración SMTP"
                                >
                                    <Zap size={14} className={testingEmail ? "animate-pulse text-amber-400" : ""} />
                                    {testingEmail ? "Probando..." : "Probar SMTP"}
                                </button>
                                <button onClick={fetchInvitations} className="p-2 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block rounded-[1.5rem] overflow-x-auto border border-white/5 bg-white/[0.02] custom-scrollbar">
                            <table className="w-full text-left text-sm min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest">Email</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest">Negocio</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest">Fecha</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest text-center">Estado</th>
                                        <th className="p-5 font-black text-white/30 uppercase text-[10px] tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {invitations.length === 0 ? (
                                        <tr><td colSpan={5} className="p-10 text-center text-white/20 italic">No hay invitaciones registradas</td></tr>
                                    ) : invitations.map(inv => (
                                        <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-5 font-medium">{inv.email}</td>
                                            <td className="p-5 text-violet-400 font-bold">{inv.businessName || "—"}</td>
                                            <td className="p-5 text-white/40 text-xs">{new Date(inv.createdAt).toLocaleDateString("es-ES")}</td>
                                            <td className="p-5 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${inv.status === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                                                    {inv.status === "PENDING" ? "Pendiente" : "Aceptada"}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <button onClick={() => handleDeleteInvitation(inv.id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {invitations.length === 0 ? (
                                <div className="p-10 text-center text-white/20 italic">No hay invitaciones</div>
                            ) : invitations.map(inv => (
                                <div key={inv.id} className="glass p-4 rounded-2xl border-white/5 bg-white/[0.02] space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-sm tracking-tight truncate max-w-[200px]">{inv.email}</p>
                                            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">{inv.businessName || "—"}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${inv.status === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                                            {inv.status === "PENDING" ? "WAIT" : "YES"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <span className="text-[10px] text-white/30 font-mono">{new Date(inv.createdAt).toLocaleDateString("es-ES")}</span>
                                        <button onClick={() => handleDeleteInvitation(inv.id)} className="p-2 text-red-400 bg-red-400/10 rounded-xl">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Tab: Appointments ────────────────────────────────────── */}
                {activeTab === "appointments" && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className="text-lg font-bold shrink-0">Citas de Todos los Negocios</h2>
                            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                                <div className="flex flex-wrap gap-2 bg-white/5 p-1 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
                                    {["all", "CONFIRMED", "CANCELLED"].map(f => (
                                        <button key={f} onClick={() => setAppointmentFilter(f)}
                                            className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${appointmentFilter === f ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                                            {f === "all" ? "Todas" : f === "CONFIRMED" ? "Confirmadas" : "Canceladas"}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative flex-1 sm:flex-none">
                                    <select
                                        value={selectedClientFilter}
                                        onChange={e => setSelectedClientFilter(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] sm:py-1.5 font-black uppercase outline-none focus:border-blue-600 appearance-none cursor-pointer pr-10 text-white/60"
                                    >
                                        <option value="all" className="bg-[#0f0f18] text-white">Todas las cuentas</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id} className="bg-[#0f0f18] text-white">{c.businessName || c.email}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                                </div>

                                <button onClick={fetchAllAppointments} className="p-2 sm:p-1.5 shrink-0 text-white/40 hover:text-white transition-colors rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
                                    <RefreshCw size={15} />
                                </button>
                            </div>
                        </div>
                        <AppointmentsTable
                            appointments={appointments.filter(a => {
                                const passStatus = appointmentFilter === "all" || a.status === appointmentFilter;
                                const passClient = selectedClientFilter === "all" || a.clientId === selectedClientFilter || a.client?.id === selectedClientFilter;
                                return passStatus && passClient;
                            })}
                            loading={loadingAppointments}
                            onCancel={handleCancelAppointment}
                            showClient
                        />
                    </div>
                )}
            </div>

            {/* ── Invitation / Lead Modal ─────────────────────────────────── */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-[#0f0f18] w-full max-w-lg rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col my-auto max-h-screen relative">
                        <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-xl sm:text-2xl font-black mb-1">Nueva Invitación</h2>
                            <p className="text-white/30 text-[10px] sm:text-xs uppercase font-black tracking-widest">Venta y Captura de Prospectos</p>
                            <button onClick={() => setIsInviteModalOpen(false)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 sm:p-8 space-y-4 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Nombre / Empresa</label>
                                    <input
                                        value={inviteForm.name}
                                        onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                                        placeholder="Ej: Neural360"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-blue-600 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Email</label>
                                    <input
                                        value={inviteForm.email}
                                        onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                                        placeholder="correo@ejemplo.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-blue-600 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Tipo de Invitación</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setInviteForm({ ...inviteForm, type: "stripe" })}
                                            className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase transition-all border ${inviteForm.type === "stripe" ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>
                                            Cobrar (Stripe)
                                        </button>
                                        <button
                                            onClick={() => setInviteForm({ ...inviteForm, type: "free" })}
                                            className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase transition-all border ${inviteForm.type === "free" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>
                                            Gratis (Pase VIP)
                                        </button>
                                    </div>
                                </div>
                                {inviteForm.type === "stripe" && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Plan Elegido</label>
                                        <div className="relative">
                                            <select
                                                value={inviteForm.plan}
                                                onChange={e => setInviteForm({ ...inviteForm, plan: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-blue-600 outline-none appearance-none cursor-pointer pr-10"
                                            >
                                                <option value="monthly" className="bg-[#0f0f18] text-white">Mensual (Setup Incl.)</option>
                                                <option value="quarterly" className="bg-[#0f0f18] text-white">Trimestral</option>
                                                <option value="biannual" className="bg-[#0f0f18] text-white">Semestral</option>
                                                <option value="annual" className="bg-[#0f0f18] text-white">Anual</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Teléfono (Opcional)</label>
                                <input
                                    value={inviteForm.phone}
                                    onChange={e => setInviteForm({ ...inviteForm, phone: e.target.value })}
                                    placeholder="+34..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-blue-600 outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Notas Internas</label>
                                <textarea
                                    value={inviteForm.notes}
                                    onChange={e => setInviteForm({ ...inviteForm, notes: e.target.value })}
                                    placeholder="Cualquier detalle relevante para la venta..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-blue-600 outline-none h-24 resize-none"
                                />
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="order-2 sm:order-1 flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSendInviteLink}
                                    disabled={sendingInvite}
                                    className="order-1 sm:order-2 flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {sendingInvite ? <RefreshCw size={18} className="animate-spin" /> : <><Zap size={18} /> Enviar Propuesta</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Client Detail Modal ──────────────────────────────────────── */}
            {selectedClient && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-0 sm:p-4">
                    <div className="bg-[#0f0f18] w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-[2rem] border-white/5 shadow-2xl flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center text-2xl font-black text-blue-400 border border-blue-600/20">
                                    {(selectedClient.businessName || "B")[0].toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">{selectedClient.businessName || "Sin nombre"}</h2>
                                    <p className="text-white/30 font-mono text-[10px]">{selectedClient.id}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
                                <button onClick={() => handleUpdateAgent(selectedClient.id)} disabled={updatingAgent || !selectedClient.retellAgentId}
                                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-600 shadow-lg shadow-violet-600/20 border border-violet-500 hover:bg-violet-500 transition-all flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider disabled:opacity-30">
                                    {updatingAgent ? <RefreshCw size={14} className="animate-spin" /> : <Bot size={14} />}
                                    Actualizar
                                </button>
                                <button onClick={() => setSelectedClient(null)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hidden sm:block">
                                    <X size={20} />
                                </button>
                                <button onClick={() => setSelectedClient(null)} className="sm:hidden absolute top-4 right-4 p-2 bg-white/5 rounded-full">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex gap-1 px-4 sm:px-6 pt-4 shrink-0 border-b border-white/5 overflow-x-auto custom-scrollbar">
                            {(["info", "activity", "appointments", "subscription"] as ClientDetailTab[]).map(t => (
                                <button key={t} onClick={() => setClientDetailTab(t)}
                                    className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap font-bold transition-all border-b-2 ${clientDetailTab === t ? "text-blue-400 border-blue-500" : "text-white/30 border-transparent hover:text-white"}`}>
                                    {t === "info" ? "Configuración" : t === "activity" ? "Actividad" : t === "appointments" ? "Citas" : "Suscripción"}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* ── Info Tab ─────────────────────────────────── */}
                            {clientDetailTab === "info" && (
                                <>
                                    {/* Editable Fields Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { field: "businessName", label: "Nombre del Negocio", icon: <Users size={14} /> },
                                            { field: "email", label: "Email", icon: <Mail size={14} /> },
                                            { field: "phone", label: "Teléfono Bot (Netelip)", icon: <Phone size={14} /> },
                                            { field: "transferPhone", label: "Teléfono Desvío", icon: <Phone size={14} /> },
                                            { field: "agentName", label: "Nombre del Agente", icon: <Bot size={14} /> },
                                            { field: "agentTone", label: "Tono del Agente", icon: <MessageSquare size={14} /> },
                                            { field: "calendarId", label: "ID Calendario Google", icon: <Calendar size={14} /> },
                                            { field: "retellAgentId", label: "Retell Agent ID", icon: <Database size={14} /> },
                                            { field: "databaseUrl", label: "URL de Base de Datos", icon: <Database size={14} /> },
                                            { field: "googleAccessToken", label: "Token Google (Dev Mock)", icon: <Settings size={14} /> },
                                        ].map(({ field, label, icon }) => (
                                            <EditableField
                                                key={field}
                                                label={label}
                                                icon={icon}
                                                value={selectedClient[field] || ""}
                                                isEditing={editingField === field}
                                                editValue={editValue}
                                                saving={saving}
                                                onEdit={() => { setEditingField(field); setEditValue(selectedClient[field] || ""); }}
                                                onCancel={() => setEditingField(null)}
                                                onSave={() => handleSaveField(field, editValue)}
                                                onChange={setEditValue}
                                            />
                                        ))}
                                    </div>

                                    {/* Status + Onboarding */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                        <div className="cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => handleSaveField("isActive", !selectedClient.isActive as any)}>
                                            <StatusBadge label="Estado" value={selectedClient.isActive ? "Activo" : "Suspendido"} active={selectedClient.isActive} />
                                        </div>
                                        <div className="cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => handleSaveField("onboardingDone", !selectedClient.onboardingDone as any)}>
                                            <StatusBadge label="Onboarding" value={selectedClient.onboardingDone ? "Completado" : `Paso ${selectedClient.onboardingStep}`} active={selectedClient.onboardingDone} />
                                        </div>
                                        {selectedClient.googleAccessToken ? (
                                            <StatusBadge label="Google Calendar" value="Conectado" active={true} />
                                        ) : (
                                            <div
                                                className="cursor-pointer hover:scale-[1.02] transition-transform group"
                                                onClick={() => window.location.href = '/api/google/connect'}
                                                title="Haz clic para autorizar a Google Calendar en esta cuenta"
                                            >
                                                <StatusBadge label="Google Calendar" value="Haz clic para conectar" active={false} />
                                            </div>
                                        )}
                                        <StatusBadge label="Agente Retell" value={selectedClient.retellAgentId ? "Vinculado" : "Sin agente"} active={!!selectedClient.retellAgentId} />
                                    </div>
                                </>
                            )}

                            {/* ── Activity Tab ─────────────────────────────── */}
                            {clientDetailTab === "activity" && (
                                <>
                                    <div className="flex justify-between items-center bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                                        <div>
                                            <h3 className="font-bold">Informe de Actividad</h3>
                                            <p className="text-xs text-white/30 uppercase font-black tracking-widest mt-0.5">Llamadas y Reservas</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {[["last_month", "Último Mes"], ["last_quarter", "Trimestre"]].map(([p, label]) => (
                                                <button key={p} onClick={() => setPeriod(p)}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${period === p ? "bg-blue-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {loadingReport ? (
                                        <div className="h-40 flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : reportData ? (
                                        <>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <MiniStat label="Total Llamadas" value={reportData.summary.totalCalls} color="blue" />
                                                <MiniStat label="Tiempo Total" value={`${Math.round(reportData.summary.totalDurationSec / 60)} min`} color="violet" />
                                                <MiniStat label="Reservas" value={reportData.summary.bookedCount} color="emerald" />
                                                <MiniStat label="Duración Media" value={`${Math.floor(reportData.summary.averageDurationSec / 60)}:${(reportData.summary.averageDurationSec % 60).toString().padStart(2, '0')}`} color="amber" />
                                            </div>

                                            {reportData.logs?.length > 0 && (
                                                <div className="space-y-3">
                                                    {/* Desktop Table */}
                                                    <div className="hidden md:block rounded-2xl border border-white/5 overflow-hidden">
                                                        <table className="w-full text-xs text-left">
                                                            <thead>
                                                                <tr className="bg-white/[0.03] border-b border-white/5">
                                                                    <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px]">Fecha</th>
                                                                    <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px]">Acción</th>
                                                                    <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px]">Resumen</th>
                                                                    <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px] text-right">Duración</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-white/5">
                                                                {reportData.logs.slice(0, 15).map((log: any) => (
                                                                    <tr key={log.id} className="hover:bg-white/[0.02]">
                                                                        <td className="p-4 text-white/40 font-mono">{new Date(log.createdAt).toLocaleDateString("es-ES")}</td>
                                                                        <td className="p-4">
                                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${log.actionTaken === "booked" ? "bg-emerald-500/20 text-emerald-400" : log.actionTaken === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                                                                                {log.actionTaken || "info"}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-4 text-white/70">{log.summary || "—"}</td>
                                                                        <td className="p-4 text-right text-white/40">
                                                                            {log.durationSec ? `${Math.floor(log.durationSec / 60)}:${(log.durationSec % 60).toString().padStart(2, '0')}` : "—"}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Mobile Card List */}
                                                    <div className="md:hidden space-y-3">
                                                        {reportData.logs.slice(0, 10).map((log: any) => (
                                                            <div key={log.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] text-white/30 font-mono">{new Date(log.createdAt).toLocaleDateString("es-ES")}</span>
                                                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${log.actionTaken === "booked" ? "bg-emerald-500/20 text-emerald-400" : log.actionTaken === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                                                                        {log.actionTaken || "info"}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-white/70 leading-relaxed">{log.summary || "Sin resumen"}</p>
                                                                {log.durationSec && (
                                                                    <div className="pt-2 border-t border-white/5 flex justify-end">
                                                                        <span className="text-[10px] text-white/30 font-mono">
                                                                            {Math.floor(log.durationSec / 60)}:{(log.durationSec % 60).toString().padStart(2, '0')} min
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-white/20 italic text-sm">No hay datos para este período</div>
                                    )}
                                </>
                            )}

                            {/* ── Subscription Tab ────────────────────────── */}
                            {clientDetailTab === "subscription" && (
                                <SubscriptionTab
                                    client={selectedClient}
                                    onCreateCheckout={(plan) => handleCreateCheckout(selectedClient.id, plan)}
                                    onOpenPortal={() => handleOpenPortal(selectedClient.id)}
                                    creatingCheckout={creatingCheckout}
                                    openingPortal={openingPortal}
                                />
                            )}

                            {/* ── Appointments Tab ─────────────────────────── */}
                            {clientDetailTab === "appointments" && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold">Citas de {selectedClient.businessName}</h3>
                                        <div className="flex gap-2">
                                            {["all", "CONFIRMED", "CANCELLED"].map(f => (
                                                <button key={f} onClick={() => setAppointmentFilter(f)}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${appointmentFilter === f ? "bg-blue-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>
                                                    {f === "all" ? "Todas" : f === "CONFIRMED" ? "Confirmadas" : "Canceladas"}
                                                </button>
                                            ))}
                                            <button onClick={() => fetchClientAppointments(selectedClient.id)} className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                                                <RefreshCw size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <AppointmentsTable
                                        appointments={appointments.filter(a => appointmentFilter === "all" || a.status === appointmentFilter)}
                                        loading={loadingAppointments}
                                        onCancel={handleCancelAppointment}
                                        showClient={false}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab: Settings ─────────────────────────────────────────── */}
            {activeTab === "settings" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* ... (existing settings content) ... */}
                </div>
            )}

            {/* ── Tab: Tickets ─────────────────────────────────────────── */}
            {activeTab === "tickets" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                        <div>
                            <h2 className="text-xl font-black flex items-center gap-2">
                                <LifeBuoy className="text-blue-500" size={24} />
                                Gestión de Soporte Técnico
                            </h2>
                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">SLA 24h · Orden de llegada (FIFO)</p>
                        </div>
                        <button onClick={fetchTickets} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all font-bold text-xs text-white/60">
                            <RefreshCw size={14} className={loadingTickets ? "animate-spin" : ""} />
                            Sincronizar
                        </button>
                    </div>

                    {loadingTickets ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <RefreshCw className="animate-spin text-blue-500" size={32} />
                            <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">Cargando incidencias...</p>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-20 text-center">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Todo en órden</h3>
                            <p className="text-white/30 text-sm">No hay tickets pendientes de resolución.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {tickets.map((ticket) => (
                                <div key={ticket.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                        <div className="flex gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${ticket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    ticket.status === 'open' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                                                }`}>
                                                {ticket.status === 'resolved' ? <CheckCircle2 size={24} /> :
                                                    ticket.status === 'open' ? <Activity size={24} /> : <Clock size={24} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <h4 className="font-bold text-lg truncate">{ticket.subject}</h4>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-widest ${ticket.category === 'tecnico' ? 'bg-red-500/20 text-red-400' :
                                                            ticket.category === 'integracion' ? 'bg-violet-500/20 text-violet-400' : 'bg-white/10 text-white/40'
                                                        }`}>
                                                        {ticket.category}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-widest bg-white/5 text-white/30`}>
                                                        Prioridad: {ticket.priority}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400">
                                                        {ticket.client?.businessName?.[0]?.toUpperCase() || 'C'}
                                                    </div>
                                                    <span className="text-xs font-bold text-white/60">{ticket.client?.businessName}</span>
                                                    <span className="text-white/20 px-1">·</span>
                                                    <span className="text-[10px] text-white/40 font-mono">{ticket.client?.email}</span>
                                                </div>
                                                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 mb-4">
                                                    <p className="text-sm text-white/70 leading-relaxed italic">"{ticket.description}"</p>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest block ml-1">Respuesta / Notas de Admin</label>
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Escribe la solución o progreso..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all resize-none placeholder:text-white/20"
                                                        defaultValue={ticket.adminNotes || ""}
                                                        onBlur={(e) => handleUpdateTicket(ticket.id, { adminNotes: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-white/20 tracking-[0.2em] block ml-1">Estado</label>
                                                <select
                                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-500 appearance-none min-w-[140px]"
                                                    value={ticket.status}
                                                    onChange={(e) => handleUpdateTicket(ticket.id, { status: e.target.value, resolvedAt: e.target.value === 'resolved' ? new Date().toISOString() : null })}
                                                >
                                                    <option value="open" className="bg-[#1a1a1f]">🔵 Abierto</option>
                                                    <option value="in_progress" className="bg-[#1a1a1f]">🟠 En Proceso</option>
                                                    <option value="resolved" className="bg-[#1a1a1f]">🟢 Resuelto</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-white/20 tracking-[0.2em] block ml-1">Prioridad</label>
                                                <select
                                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-500 appearance-none min-w-[140px]"
                                                    value={ticket.priority}
                                                    onChange={(e) => handleUpdateTicket(ticket.id, { priority: e.target.value })}
                                                >
                                                    <option value="low" className="bg-[#1a1a1f]">Baja</option>
                                                    <option value="medium" className="bg-[#1a1a1f]">Media</option>
                                                    <option value="high" className="bg-[#1a1a1f]">Alta</option>
                                                    <option value="urgent" className="bg-[#1a1a1f]">🔥 Urgente</option>
                                                </select>
                                            </div>

                                            <div className="pt-2">
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest text-right">
                                                    Creado: {new Date(ticket.createdAt).toLocaleDateString()}
                                                </p>
                                                {ticket.resolvedAt && (
                                                    <p className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest text-right mt-1">
                                                        Resuelto: {new Date(ticket.resolvedAt).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ title, value, sub, icon, color }: { title: string; value: any; sub: string; icon: React.ReactNode; color: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-600/10 border-blue-600/20",
        emerald: "bg-emerald-600/10 border-emerald-600/20",
        violet: "bg-violet-600/10 border-violet-600/20",
        amber: "bg-amber-600/10 border-amber-600/20",
    };
    return (
        <div className={`rounded-2xl p-5 border ${colors[color]} bg-white/[0.02]`}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">{title}</p>
                {icon}
            </div>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-[10px] text-white/20 mt-1">{sub}</p>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col items-center">
            <span className="font-black text-base">{value}</span>
            <span className="text-[9px] text-white/20 uppercase font-black tracking-tighter">{label}</span>
        </div>
    );
}

function InfraTag({ active, label }: { active: boolean; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-red-400"}`} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">{label}</span>
        </div>
    );
}

function EditableField({ label, icon, value, isEditing, editValue, saving, onEdit, onCancel, onSave, onChange }: any) {
    return (
        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 group">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-white/30">{icon}</span>
                <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">{label}</p>
            </div>
            {isEditing ? (
                <div className="flex flex-col gap-3 mt-1">
                    <input
                        autoFocus
                        value={editValue}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
                        className="w-full bg-white/10 border border-blue-500/50 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 shadow-inner"
                    />
                    <div className="flex gap-2">
                        <button onClick={onSave} disabled={saving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-bold text-xs text-white">
                            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            Guardar
                        </button>
                        <button onClick={onCancel} className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all flex items-center justify-center text-white/40">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <p className="font-bold text-sm truncate">{value || <span className="text-white/20 italic font-normal">No configurado</span>}</p>
                    <button onClick={onEdit} className="p-1.5 opacity-0 group-hover:opacity-100 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all">
                        <Edit2 size={13} />
                    </button>
                </div>
            )}
        </div>
    );
}

function InfoCard({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
    return (
        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-2">{label}</p>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-mono text-white/70 truncate">{value}</p>
                {onCopy && (
                    <button onClick={onCopy} className="p-1.5 text-white/20 hover:text-white hover:bg-white/10 rounded-lg transition-all shrink-0">
                        <Copy size={12} />
                    </button>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ label, value, active }: { label: string; value: string; active: boolean }) {
    return (
        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center h-full min-h-[90px]">
            <p className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-3">{label}</p>
            <span className={`w-full max-w-[120px] px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center transition-all ${active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.05)]" : "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]"}`}>
                {value}
            </span>
        </div>
    );
}

function MiniStat({ label, value, color }: { label: string; value: any; color: string }) {
    const colors: Record<string, string> = {
        blue: "text-blue-400", emerald: "text-emerald-400", violet: "text-violet-400", amber: "text-amber-400"
    };
    return (
        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-black ${colors[color]}`}>{value}</p>
        </div>
    );
}

function AppointmentsTable({ appointments, loading, onCancel, showClient }: { appointments: any[]; loading: boolean; onCancel: (id: string) => void; showClient: boolean }) {
    if (loading) {
        return (
            <div className="h-40 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (appointments.length === 0) {
        return <div className="h-40 flex items-center justify-center text-white/20 italic text-sm">No hay citas para mostrar</div>;
    }
    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border border-white/5 overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs text-left min-w-[800px]">
                    <thead>
                        <tr className="bg-white/[0.03] border-b border-white/5">
                            {showClient && <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px]">Negocio</th>}
                            <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px]">Cliente</th>
                            <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px]">Servicio</th>
                            <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px]">Fecha / Hora</th>
                            <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px]">Profesional</th>
                            <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px] text-center">SMS</th>
                            <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px] text-center">Estado</th>
                            <th className="p-4 font-black text-white/30 uppercase tracking-widest text-[9px] text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {appointments.map((a: any) => (
                            <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                                {showClient && <td className="p-4 font-bold text-blue-400">{a.client?.businessName || a.clientId?.slice(0, 8)}</td>}
                                <td className="p-4">
                                    <p className="font-bold">{a.callerName}</p>
                                    {a.callerPhone && (
                                        <a href={`tel:${a.callerPhone}`} className="text-white/40 hover:text-white transition-colors font-mono flex items-center gap-1.5 w-fit mt-0.5 group" title="Llamar al cliente">
                                            <Phone size={10} className="group-hover:scale-110 transition-transform" />
                                            {a.callerPhone}
                                        </a>
                                    )}
                                </td>
                                <td className="p-4 text-white/70">{a.serviceName}</td>
                                <td className="p-4 font-mono">
                                    <p>{a.date}</p>
                                    <p className="text-white/40">{a.time}</p>
                                </td>
                                <td className="p-4 text-white/50">{a.staffName || "—"}</td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <span title="Confirmación" className={`w-2 h-2 rounded-full ${a.smsConfirmationSent ? "bg-emerald-400" : "bg-white/10"}`} />
                                        <span title="Recordatorio" className={`w-2 h-2 rounded-full ${a.smsReminderSent ? "bg-blue-400" : "bg-white/10"}`} />
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${a.status === "CONFIRMED" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                                        {a.status === "CONFIRMED" ? "Confirmada" : "Cancelada"}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {a.status === "CONFIRMED" && (
                                        <button onClick={() => onCancel(a.id)} className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Cancelar cita">
                                            <CalendarX size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {appointments.map((a: any) => (
                    <div key={a.id} className="glass p-4 rounded-2xl border-white/5 bg-white/[0.02] space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-sm tracking-tight">{a.callerName}</p>
                                {showClient && <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">{a.client?.businessName || 'Negocio'}</p>}
                                <p className="text-[10px] text-white/30 font-mono mt-0.5">{a.date} • {a.time}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${a.status === "CONFIRMED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/10"}`}>
                                {a.status === "CONFIRMED" ? "OK" : "BYE"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                                    <Settings size={14} />
                                </div>
                                <span className="text-[10px] text-white/60 font-bold">{a.serviceName}</span>
                            </div>
                            {a.status === "CONFIRMED" && (
                                <button onClick={() => onCancel(a.id)} className="p-2 text-red-400 bg-red-400/10 rounded-xl">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── SubscriptionTab Component ────────────────────────────────────────────────
function SubscriptionTab({ client, onCreateCheckout, onOpenPortal, creatingCheckout, openingPortal }: {
    client: any;
    onCreateCheckout: (plan: string) => void;
    onOpenPortal: () => void;
    creatingCheckout: boolean;
    openingPortal: boolean;
}) {
    const [selectedPlan, setSelectedPlan] = React.useState("biannual");

    const statusColors: Record<string, string> = {
        active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        past_due: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        canceled: "bg-red-500/10 text-red-400 border-red-500/20",
        inactive: "bg-white/5 text-white/30 border-white/10",
    };

    const statusLabels: Record<string, string> = {
        active: "Activa",
        past_due: "Pago pendiente",
        canceled: "Cancelada",
        inactive: "Sin suscripción",
    };

    const planLabels: Record<string, string> = {
        monthly: "Mensual",
        quarterly: "Trimestral",
        biannual: "Semestral",
        annual: "Anual",
    };

    const status = client.subscriptionStatus || "inactive";
    const hasSubscription = !!client.stripeSubscriptionId;

    return (
        <div className="space-y-6">
            {/* Status card */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-sm">Estado de Suscripción</h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColors[status] || statusColors.inactive}`}>
                        {statusLabels[status] || status}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <p className="text-white/30 mb-1">Plan</p>
                        <p className="font-bold">{planLabels[client.subscriptionPlan || ""] || "—"}</p>
                    </div>
                    <div>
                        <p className="text-white/30 mb-1">Inicio</p>
                        <p className="font-mono">{client.subscriptionStart ? new Date(client.subscriptionStart).toLocaleDateString("es-ES") : "—"}</p>
                    </div>
                    <div>
                        <p className="text-white/30 mb-1">Vencimiento</p>
                        <p className={`font-mono font-bold ${status === "active" && client.subscriptionEnd && new Date(client.subscriptionEnd) < new Date(Date.now() + 7 * 86400000) ? "text-amber-400" : ""}`}>
                            {client.subscriptionEnd ? new Date(client.subscriptionEnd).toLocaleDateString("es-ES") : "—"}
                        </p>
                    </div>
                    <div>
                        <p className="text-white/30 mb-1">Último pago</p>
                        <p className="font-mono">{client.lastPaymentAt ? new Date(client.lastPaymentAt).toLocaleDateString("es-ES") : "—"}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-white/30 mb-1">Stripe Customer ID</p>
                        <p className="font-mono text-white/50 truncate">{client.stripeCustomerId || "—"}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-white/30 mb-1">Stripe Subscription ID</p>
                        <p className="font-mono text-white/50 truncate">{client.stripeSubscriptionId || "—"}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {hasSubscription ? (
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-3">
                    <h3 className="font-black text-sm mb-3">Gestión de Facturación</h3>
                    <p className="text-white/40 text-xs">Accede al portal de Stripe para ver facturas, cambiar el método de pago o cancelar la suscripción.</p>
                    <button
                        onClick={onOpenPortal}
                        disabled={openingPortal}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all"
                    >
                        {openingPortal ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Abriendo portal...</>
                        ) : (
                            <><ExternalLink className="w-4 h-4" /> Abrir Portal de Facturación</>
                        )}
                    </button>
                </div>
            ) : (
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
                    <h3 className="font-black text-sm">Crear Suscripción</h3>
                    <p className="text-white/40 text-xs text-balance">Selecciona un plan. Solo en el **Plan Mensual** se añadirá automáticamente el <strong className="text-blue-400">Setup de 899€</strong>.</p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {(["monthly", "quarterly", "biannual", "annual"] as const).map(plan => (
                            <button
                                key={plan}
                                onClick={() => setSelectedPlan(plan)}
                                className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${selectedPlan === plan ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}
                            >
                                {planLabels[plan]}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => onCreateCheckout(selectedPlan)}
                        disabled={creatingCheckout}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all"
                    >
                        {creatingCheckout ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creando enlace de pago...</>
                        ) : (
                            <><Zap className="w-4 h-4" /> Generar Enlace de Pago</>
                        )}
                    </button>
                </div>
            )}

            {/* Renewal reminder status */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
                <h3 className="font-black text-sm mb-3">Recordatorio de Renovación</h3>
                <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${client.renewalReminderSent ? "bg-emerald-400" : "bg-white/10"}`} />
                    <span className="text-xs text-white/50">
                        {client.renewalReminderSent
                            ? `Email enviado el ${client.renewalReminderSentAt ? new Date(client.renewalReminderSentAt).toLocaleDateString("es-ES") : "—"}`
                            : "Pendiente de enviar (se enviará 7 días antes del vencimiento)"}
                    </span>
                </div>
            </div>
        </div>
    );
}
