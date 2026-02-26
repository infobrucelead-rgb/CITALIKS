"use client";
import React, { useState, useEffect } from "react";
import { Users, Calendar, Clock, ChevronRight, Loader2 } from "lucide-react";

export default function BookingClient({ initialClient }: { initialClient: any }) {
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    useEffect(() => {
        if (selectedStaff) {
            fetchEvents(selectedStaff.id);
        }
    }, [selectedStaff]);

    const fetchEvents = async (staffId: string) => {
        setLoadingEvents(true);
        try {
            const res = await fetch(`/api/calendar/events?staffId=${staffId}`);
            const data = await res.json();
            setEvents(data.events || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingEvents(false);
        }
    };

    return (
        <div className="space-y-8">
            <section>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Users className="text-blue-400" size={20} />
                    Selecciona a un profesional
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {initialClient.staff.map((member: any) => (
                        <button
                            key={member.id}
                            onClick={() => setSelectedStaff(member)}
                            className={`glass p-6 rounded-3xl text-left transition-all border-2 ${selectedStaff?.id === member.id
                                    ? "border-blue-600 bg-blue-600/10"
                                    : "border-white/5 hover:border-white/20"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
                                    {member.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold">{member.name}</h3>
                                    <p className="text-xs text-white/40">Disponible hoy</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {selectedStaff && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Calendar className="text-violet-400" size={20} />
                        Disponibilidad de {selectedStaff.name}
                    </h2>

                    <div className="glass rounded-[2.5rem] p-8 border-white/5 bg-white/2 relative overflow-hidden">
                        {loadingEvents ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="animate-spin text-blue-400" size={40} />
                                <p className="text-white/40 animate-pulse">Consultando calendario real...</p>
                            </div>
                        ) : events.length > 0 ? (
                            <div className="space-y-4">
                                {events.map((event: any, i: number) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-center p-3 rounded-xl bg-violet-600/10 border border-violet-500/20 min-w-[70px]">
                                                <span className="text-[10px] uppercase font-bold text-violet-400 mb-1">
                                                    {new Date(event.start).toLocaleDateString("es-ES", { weekday: "short" })}
                                                </span>
                                                <span className="text-xl font-mono font-bold">
                                                    {new Date(event.start).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-white/80">Ocupado</p>
                                                <p className="text-xs text-white/30">Evento de Google Calendar</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-white/10 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                ))}
                                <p className="text-center text-xs text-white/20 pt-6">
                                    Esta vista muestra los eventos actuales. <br />
                                    Los huecos libres entre estos eventos son los disponibles para tu cita.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-white/40">No hay eventos próximos. ¡Todo libre!</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            <section>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Clock className="text-emerald-400" size={20} />
                    Servicios ofrecidos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {initialClient.services.map((service: any) => (
                        <div key={service.id} className="glass p-6 rounded-3xl border-white/5 bg-white/2 flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                            <div>
                                <h3 className="font-bold group-hover:text-emerald-400 transition-colors">{service.name}</h3>
                                <p className="text-xs text-white/40">{service.durationMin} minutos</p>
                            </div>
                            {service.price && (
                                <div className="text-xl font-bold text-emerald-400">
                                    {service.price}€
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
