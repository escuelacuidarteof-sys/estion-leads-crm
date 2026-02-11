import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TeamMember } from '../types/database';
import { Plus, Trash2, Users, AlertCircle } from 'lucide-react';

export default function TeamManagement() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newMember, setNewMember] = useState({ name: '', role: 'Closer' });

    const fetchTeam = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setTeam(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    const handleAddMember = async () => {
        if (!newMember.name) return;
        try {
            const { error } = await supabase.from('team_members').insert([newMember]);
            if (error) throw error;
            setNewMember({ name: '', role: 'Closer' });
            fetchTeam();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteMember = async (id: string) => {
        try {
            const { error } = await supabase.from('team_members').delete().eq('id', id);
            if (error) throw error;
            fetchTeam();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <div className="text-center p-10 text-gray-500 italic">Cargando equipo...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                    <Users size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Equipo</h1>
                    <p className="text-sm text-gray-500">Administra los integrantes de tu equipo de ventas</p>
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Añadir Nuevo Integrante</h3>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Nombre completo"
                            className="w-full border-gray-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border text-sm"
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        />
                    </div>
                    <div className="w-1/3">
                        <select
                            className="w-full border-gray-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border text-sm bg-white"
                            value={newMember.role}
                            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                        >
                            <option value="Closer">Closer</option>
                            <option value="Setter">Setter</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <button
                        onClick={handleAddMember}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-bold text-sm shadow-lg shadow-blue-100 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Añadir
                    </button>
                </div>
                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-xs">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.map(member => (
                    <div key={member.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                {member.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 text-sm">{member.name}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{member.role}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors bg-gray-50 p-2 rounded-lg group-hover:bg-red-50"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {team.length === 0 && (
                    <div className="col-span-full py-10 text-center text-gray-400 border border-dashed rounded-xl italic text-sm">
                        No hay integrantes registrados aún.
                    </div>
                )}
            </div>
        </div>
    );
}
