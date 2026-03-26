import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { Client } from '../../types';
import jsPDF from 'jspdf';

interface MedicalHistoryPdfProps {
  client: Client;
}

const PERIOD_OPTIONS = [
  { value: 2, label: '2 semanas' },
  { value: 4, label: '4 semanas' },
  { value: 8, label: '8 semanas' },
  { value: 12, label: '12 semanas' },
];

export function MedicalHistoryPdf({ client }: MedicalHistoryPdfProps) {
  const [generating, setGenerating] = useState(false);
  const [weeks, setWeeks] = useState(4);

  const generate = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - weeks * 7);
      const startStr = startDate.toISOString().split('T')[0];
      const pageW = doc.internal.pageSize.getWidth();

      // Fetch all data in parallel
      const [wellnessRes, weightRes, treatmentRes, reviewRes, symptomsRes] = await Promise.all([
        supabase.from('wellness_logs').select('*').eq('client_id', client.id).gte('log_date', startStr).order('log_date', { ascending: true }),
        supabase.from('weight_history').select('*').eq('client_id', client.id).gte('date', startStr).order('date', { ascending: true }),
        supabase.from('treatment_sessions').select('*').eq('client_id', client.id).gte('session_date', startStr).order('session_date', { ascending: true }),
        supabase.from('oncology_reviews').select('*').eq('client_id', client.id).gte('review_date', startStr).order('review_date', { ascending: true }),
        supabase.from('treatment_symptoms').select('*').eq('client_id', client.id).gte('log_date', startStr).order('log_date', { ascending: true }),
      ]);

      const wellness = wellnessRes.data || [];
      const weights = weightRes.data || [];
      const treatments = treatmentRes.data || [];
      const reviews = reviewRes.data || [];
      const symptoms = symptomsRes.data || [];

      // --- PAGE 1: Header ---
      doc.setFillColor(107, 160, 107);
      doc.rect(0, 0, pageW, 38, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('Informe de Seguimiento', 15, 18);
      doc.setFontSize(11);
      doc.text(`${client.firstName || ''} ${client.surname || ''} — Últimas ${weeks} semanas`, 15, 28);
      doc.setFontSize(9);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, 15, 34);

      let y = 48;
      doc.setTextColor(30, 30, 30);

      // --- Weight ---
      if (weights.length > 0) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Evolución de Peso', 15, y);
        y += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        // Table header
        doc.setFillColor(240, 240, 240);
        doc.rect(15, y - 4, pageW - 30, 6, 'F');
        doc.text('Fecha', 17, y);
        doc.text('Peso (kg)', 80, y);
        y += 6;

        weights.forEach((w: any) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(new Date(w.date + 'T12:00:00').toLocaleDateString('es-ES'), 17, y);
          doc.text(String(w.weight), 80, y);
          y += 5;
        });
        y += 8;
      }

      // --- Symptom Averages ---
      if (wellness.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen de Síntomas (media del periodo)', 15, y);
        y += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const avg = (arr: number[]) => arr.length > 0 ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : '—';
        const fatigues = wellness.map((w: any) => w.fatigue_level).filter((v: any) => v != null);
        const nauseas = wellness.map((w: any) => w.nausea_level).filter((v: any) => v != null);
        const pains = wellness.map((w: any) => w.pain_level).filter((v: any) => v != null);
        const energies = wellness.map((w: any) => w.energy_level).filter((v: any) => v != null);

        const symptomRows = [
          ['Fatiga', avg(fatigues), '/10'],
          ['Náusea', avg(nauseas), '/10'],
          ['Dolor', avg(pains), '/10'],
          ['Energía', avg(energies), '/5'],
        ];
        symptomRows.forEach(([label, val, unit]) => {
          doc.text(`${label}: ${val}${unit}`, 17, y);
          y += 5;
        });
        y += 8;
      }

      // --- Treatment-specific symptoms ---
      if (symptoms.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Síntomas Post-Tratamiento (media)', 15, y);
        y += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const fields = ['fatigue', 'nausea', 'vomiting', 'pain', 'diarrhea', 'constipation', 'appetite_loss', 'mouth_sores', 'skin_issues', 'numbness', 'brain_fog', 'mood', 'sleep_quality'];
        const labels: Record<string, string> = { fatigue: 'Fatiga', nausea: 'Náusea', vomiting: 'Vómitos', pain: 'Dolor', diarrhea: 'Diarrea', constipation: 'Estreñimiento', appetite_loss: 'Apetito', mouth_sores: 'Mucositis', skin_issues: 'Piel', numbness: 'Hormigueo', brain_fog: 'Niebla mental', mood: 'Ánimo', sleep_quality: 'Sueño' };

        fields.forEach(f => {
          const vals = symptoms.map((s: any) => s[f]).filter((v: any) => v != null && v > 0);
          if (vals.length > 0) {
            const avg = (vals.reduce((s: number, v: number) => s + v, 0) / vals.length).toFixed(1);
            doc.text(`${labels[f] || f}: ${avg}/10`, 17, y);
            y += 5;
            if (y > 270) { doc.addPage(); y = 20; }
          }
        });
        y += 8;
      }

      // --- Treatments ---
      if (treatments.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Sesiones de Tratamiento', 15, y);
        y += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const typeLabels: Record<string, string> = { chemotherapy: 'Quimioterapia', radiotherapy: 'Radioterapia', hormonotherapy: 'Hormonoterapia', immunotherapy: 'Inmunoterapia', surgery: 'Cirugía', other: 'Otro' };

        treatments.forEach((t: any) => {
          if (y > 265) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'bold');
          doc.text(`${new Date(t.session_date + 'T12:00:00').toLocaleDateString('es-ES')} — ${typeLabels[t.treatment_type] || t.treatment_type}`, 17, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          if (t.treatment_name) { doc.text(`  Protocolo: ${t.treatment_name}`, 17, y); y += 5; }
          if (t.cycle_number) { doc.text(`  Ciclo: ${t.cycle_number}${t.total_cycles ? '/' + t.total_cycles : ''}`, 17, y); y += 5; }
          if (t.notes) {
            const lines = doc.splitTextToSize(`  Notas: ${t.notes}`, pageW - 40);
            doc.text(lines, 17, y);
            y += lines.length * 4;
          }
          y += 3;
        });
        y += 5;
      }

      // --- Reviews ---
      if (reviews.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Revisiones Oncológicas', 15, y);
        y += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const reviewLabels: Record<string, string> = { routine: 'Rutina', scan: 'Imagen', blood_work: 'Analítica', follow_up: 'Seguimiento', other: 'Otro' };

        reviews.forEach((r: any) => {
          if (y > 265) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'bold');
          doc.text(`${new Date(r.review_date + 'T12:00:00').toLocaleDateString('es-ES')} — ${reviewLabels[r.review_type] || r.review_type}`, 17, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          if (r.doctor_name) { doc.text(`  Doctor: ${r.doctor_name}`, 17, y); y += 5; }
          if (r.summary) {
            const lines = doc.splitTextToSize(`  Resumen: ${r.summary}`, pageW - 40);
            doc.text(lines, 17, y);
            y += lines.length * 4;
          }
          if (r.results) {
            const lines = doc.splitTextToSize(`  Resultados: ${r.results}`, pageW - 40);
            doc.text(lines, 17, y);
            y += lines.length * 4;
          }
          y += 3;
        });
      }

      // --- Footer on all pages ---
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(`Escuela Cuid-Arte — Informe generado automáticamente — Pág. ${i}/${pageCount}`, 15, doc.internal.pageSize.getHeight() - 8);
      }

      const safeName = (client.firstName || 'paciente').replace(/\s+/g, '_');
      doc.save(`informe-medico-${safeName}-${weeks}sem.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
    setGenerating(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-brand-green" />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Informe para tu médico</h3>
      </div>
      <p className="text-xs text-slate-400 mb-3">Genera un PDF con tu evolución de peso, síntomas, tratamientos y revisiones para llevar a tu oncólogo.</p>
      <div className="flex items-center gap-2">
        <select value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="flex-1 text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-200">
          {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={generate} disabled={generating} className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {generating ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>
    </div>
  );
}
