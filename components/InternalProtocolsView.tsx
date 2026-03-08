import React from 'react';
import { FileText, ExternalLink, CalendarDays, BookOpen } from 'lucide-react';

type InternalDocument = {
  id: string;
  title: string;
  description: string;
  versionDate: string;
  url: string;
  category: 'protocolo' | 'formacion';
};

const INTERNAL_DOCUMENTS: InternalDocument[] = [
  {
    id: 'protocolo-general-actualizacion',
    title: 'Actualizacion Protocolo General',
    description: 'Referencia principal para criterios, valoraciones y flujo de trabajo del equipo.',
    versionDate: 'Documento vigente',
    url: '/docs/protocolos/actualizacion-protocolo-general.pdf',
    category: 'protocolo'
  },
  {
    id: 'curso-intensivo-oncologico',
    title: 'Curso Intensivo de Ejercicio Fisico en Paciente Oncologico',
    description: 'Material formativo para criterios de seguridad, adaptaciones y progresion del entrenamiento.',
    versionDate: 'Material de formacion',
    url: '/docs/protocolos/curso-intensivo-ejercicio-oncologico.pdf',
    category: 'formacion'
  }
];

const categoryLabel = {
  protocolo: 'Protocolo',
  formacion: 'Formacion'
};

export default function InternalProtocolsView() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 rounded-3xl border border-brand-mint/40 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-mint/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-brand-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-dark">Protocolos Internos</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Documentacion oficial del equipo disponible dentro del CRM. Usa estos documentos como referencia principal para valoraciones y toma de decisiones.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTERNAL_DOCUMENTS.map((doc) => (
          <article key={doc.id} className="rounded-3xl border border-brand-mint/40 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-sky-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-brand-dark leading-tight">{doc.title}</h2>
                  <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-mint/40 text-brand-dark">
                    {categoryLabel[doc.category]}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">{doc.description}</p>

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{doc.versionDate}</span>
            </div>

            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
            >
              Abrir documento
              <ExternalLink className="w-4 h-4" />
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
