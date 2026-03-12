import React, { useMemo, useState } from 'react';
import { BookOpen, CircleCheck, FileText, Search } from 'lucide-react';
import { User } from '../types';
import manualCoach from '../docs/manuales/MANUAL_COACH_PORTAL.md?raw';
import sopCoach from '../docs/manuales/SOP_COACH_SEMANAL.md?raw';
import faqCoach from '../docs/manuales/FAQ_COACH_Y_SOPORTE.md?raw';

interface CoachManualViewProps {
    user: User;
}

type DocId = 'manual' | 'sop' | 'faq';

const normalize = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const markdownToBlocks = (content: string) => {
    const lines = content.split('\n');
    const blocks: Array<{ type: 'h1' | 'h2' | 'h3' | 'li' | 'p' | 'divider'; text: string }> = [];

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
            blocks.push({ type: 'divider', text: '' });
            continue;
        }
        if (line.startsWith('# ')) {
            blocks.push({ type: 'h1', text: line.slice(2).trim() });
        } else if (line.startsWith('## ')) {
            blocks.push({ type: 'h2', text: line.slice(3).trim() });
        } else if (line.startsWith('### ')) {
            blocks.push({ type: 'h3', text: line.slice(4).trim() });
        } else if (/^\d+\.\s+/.test(line)) {
            blocks.push({ type: 'li', text: line.replace(/^\d+\.\s+/, '') });
        } else if (line.startsWith('- ')) {
            blocks.push({ type: 'li', text: line.slice(2).trim() });
        } else {
            blocks.push({ type: 'p', text: line });
        }
    }

    return blocks;
};

export function CoachManualView({ user }: CoachManualViewProps) {
    const [activeDoc, setActiveDoc] = useState<DocId>('manual');
    const [search, setSearch] = useState('');

    const docs = useMemo(() => {
        return {
            manual: {
                title: 'Manual Coach',
                subtitle: 'Flujo completo del CRM y Portal Cliente',
                content: manualCoach,
                updated: 'v1.0',
            },
            sop: {
                title: 'SOP Semanal',
                subtitle: 'Operacion diaria y semanal del coach',
                content: sopCoach,
                updated: 'v1.0',
            },
            faq: {
                title: 'FAQ y Soporte',
                subtitle: 'Incidencias comunes y resolucion rapida',
                content: faqCoach,
                updated: 'v1.0',
            },
        };
    }, []);

    const selectedDoc = docs[activeDoc];
    const blocks = useMemo(() => markdownToBlocks(selectedDoc.content), [selectedDoc.content]);
    const normalizedSearch = normalize(search.trim());

    const visibleBlocks = useMemo(() => {
        if (!normalizedSearch) return blocks;
        return blocks.filter(block => normalize(block.text).includes(normalizedSearch));
    }, [blocks, normalizedSearch]);

    const headingCount = blocks.filter(b => b.type === 'h2' || b.type === 'h3').length;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-white/20">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Manual Interno para Coaches</h1>
                            <p className="text-sm text-white/90 mt-1">Documentacion operativa centralizada para consulta inmediata del equipo.</p>
                        </div>
                    </div>
                    <div className="hidden md:block text-right text-xs text-white/80">
                        <p>Usuario: <span className="font-bold text-white">{user.name}</span></p>
                        <p>Rol: <span className="font-bold text-white capitalize">{String(user.role || '').replace('_', ' ')}</span></p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                    <button
                        onClick={() => setActiveDoc('manual')}
                        className={`px-4 py-3 rounded-xl border text-left transition-all ${activeDoc === 'manual' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                        <p className="text-sm font-bold">Manual Coach</p>
                        <p className="text-xs opacity-80">CRM + Portal</p>
                    </button>
                    <button
                        onClick={() => setActiveDoc('sop')}
                        className={`px-4 py-3 rounded-xl border text-left transition-all ${activeDoc === 'sop' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                        <p className="text-sm font-bold">SOP Semanal</p>
                        <p className="text-xs opacity-80">Operacion estandar</p>
                    </button>
                    <button
                        onClick={() => setActiveDoc('faq')}
                        className={`px-4 py-3 rounded-xl border text-left transition-all ${activeDoc === 'faq' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                        <p className="text-sm font-bold">FAQ y Soporte</p>
                        <p className="text-xs opacity-80">Resolucion rapida</p>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-black text-slate-800">{selectedDoc.title}</p>
                        <p className="text-xs text-slate-500">{selectedDoc.subtitle} · {selectedDoc.updated}</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar en el documento..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-wrap items-center gap-3 mb-5 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        <FileText className="w-3.5 h-3.5" />
                        Secciones: {headingCount}
                    </span>
                    {normalizedSearch && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                            <CircleCheck className="w-3.5 h-3.5" />
                            Coincidencias: {visibleBlocks.filter(b => b.text).length}
                        </span>
                    )}
                </div>

                <article className="space-y-2">
                    {visibleBlocks.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay resultados para tu busqueda en este documento.</p>
                    ) : (
                        visibleBlocks.map((block, idx) => {
                            if (block.type === 'divider') return <div key={`d-${idx}`} className="h-2" />;
                            if (block.type === 'h1') return <h2 key={`h1-${idx}`} className="text-2xl font-black text-slate-900 mt-1">{block.text}</h2>;
                            if (block.type === 'h2') return <h3 key={`h2-${idx}`} className="text-lg font-black text-slate-800 pt-3">{block.text}</h3>;
                            if (block.type === 'h3') return <h4 key={`h3-${idx}`} className="text-base font-bold text-slate-700 pt-1">{block.text}</h4>;
                            if (block.type === 'li') {
                                return (
                                    <div key={`li-${idx}`} className="flex items-start gap-2 text-sm text-slate-700">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                        <p>{block.text}</p>
                                    </div>
                                );
                            }
                            return <p key={`p-${idx}`} className="text-sm leading-relaxed text-slate-700">{block.text}</p>;
                        })
                    )}
                </article>
            </div>
        </div>
    );
}
