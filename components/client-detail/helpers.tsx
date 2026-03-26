import React, { useState, useEffect } from 'react';
import { ClientStatus, WeeklyCheckin } from '../../types';
import { normalizePhone, PHONE_HELP_TEXT, PHONE_PLACEHOLDER } from '../../utils/phoneUtils';
import {
   Circle, CircleCheck, Clock, CreditCard, Edit3, FileCheck, FileX,
   History, Loader2, X
} from 'lucide-react';

// --- HELPER FUNCTIONS ---

export const getStatusColor = (status: ClientStatus) => {
   switch (status) {
      case ClientStatus.ACTIVE: return 'bg-green-100 text-green-700';
      case ClientStatus.INACTIVE: return 'bg-slate-100 text-slate-600';
      case ClientStatus.PAUSED: return 'bg-amber-100 text-amber-700';
      case ClientStatus.DROPOUT: return 'bg-red-100 text-red-700';
      case ClientStatus.COMPLETED: return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
   }
};

export const getStatusLabel = (status: ClientStatus) => {
   switch (status) {
      case ClientStatus.ACTIVE: return 'Activo';
      case ClientStatus.INACTIVE: return 'Baja';
      case ClientStatus.PAUSED: return 'Pausa';
      case ClientStatus.DROPOUT: return 'Abandono';
      case ClientStatus.COMPLETED: return 'Completado';
      default: return status;
   }
};

// --- TYPES ---

export interface TeamReviewRecord {
   id: string;
   date: string;
   type: string;
   coach_name?: string;
   summary?: string;
   highlights?: string;
   coach_comments?: string;
   recording_url?: string;
   action_items?: any;
   created_at?: string;
}

export interface PaymentLink {
   id: string;
   name: string;
   price: number;
   url: string;
   duration_months?: number;
}

// --- DATA FIELD COMPONENT ---

export interface DataFieldProps {
   label: string;
   value: any;
   path?: string;
   type?: string;
   options?: any[];
   className?: string;
   isTextArea?: boolean;
   onChange?: (val: any) => void;
   readOnly?: boolean;
   isEditing: boolean;
   onUpdate: (path: string, value: any) => void;
   onQuickSave?: (path: string, value: any) => Promise<void>;
}

export const DataField: React.FC<DataFieldProps> = ({
   label, value, path, type = "text", options = [], className = "", isTextArea = false, onChange, readOnly = false, isEditing, onUpdate, onQuickSave
}) => {
   const [isQuickEditing, setIsQuickEditing] = useState(false);
   const [tempValue, setTempValue] = useState(value);
   const [isSaving, setIsSaving] = useState(false);

   useEffect(() => {
      if (!isQuickEditing) {
         setTempValue(value);
      }
   }, [value, isQuickEditing]);

   const handleChange = (e: any) => {
      let val = type === 'checkbox' ? e.target.checked : (type === 'number' ? Number(e.target.value) : e.target.value);

      if (label === 'Teléfono' && typeof val === 'string') {
         val = normalizePhone(val);
      }

      if (type === 'select' && path && (path.includes('duration') || path === 'program_duration_months')) {
         val = val ? parseInt(val, 10) : 0;
      }

      if (isQuickEditing) {
         setTempValue(val);
      } else {
         if (onChange) onChange(val);
         else if (path) onUpdate(path, val);
      }
   };

   const handleStartQuickEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setTempValue(value);
      setIsQuickEditing(true);
   };

   const handleCancelQuickEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setTempValue(value);
      setIsQuickEditing(false);
   };

   const handleSaveQuickEdit = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onQuickSave && path) {
         setIsSaving(true);
         try {
            await onQuickSave(path, tempValue);
            setIsQuickEditing(false);
         } finally {
            setIsSaving(false);
         }
      }
   };

   const inputBaseStyle = "w-full text-sm p-3 border border-slate-200 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm";
   const selectStyle = "w-full text-sm p-3 border border-slate-200 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm cursor-pointer";
   const checkboxStyle = "w-5 h-5 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-200 border-slate-300 transition-all duration-200 cursor-pointer";

   if ((isEditing || isQuickEditing) && (path || onChange) && !readOnly) {
      const currentVal = isQuickEditing ? tempValue : value;

      if (type === 'checkbox') {
         return (
            <div className={`mb-4 flex items-center justify-between group ${className}`}>
               <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!currentVal} onChange={handleChange} className={checkboxStyle} />
                  <label className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors cursor-pointer select-none">{label}</label>
               </div>
               {isQuickEditing && (
                  <div className="flex items-center gap-1">
                     <button onClick={handleSaveQuickEdit} disabled={isSaving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50" title="Guardar">
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CircleCheck className="w-3.5 h-3.5" />}
                     </button>
                     <button onClick={handleCancelQuickEdit} disabled={isSaving} className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors disabled:opacity-50" title="Cancelar">
                        <X className="w-3.5 h-3.5" />
                     </button>
                  </div>
               )}
            </div>
         );
      }
      return (
         <div className={`mb-4 ${className}`}>
            <div className="flex justify-between items-center mb-1.5">
               <label className="block text-[11px] text-slate-500 uppercase font-bold tracking-wider">{label}</label>
               {isQuickEditing && (
                  <div className="flex items-center gap-1">
                     <button onClick={handleSaveQuickEdit} disabled={isSaving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50" title="Guardar">
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CircleCheck className="w-3.5 h-3.5" />}
                     </button>
                     <button onClick={handleCancelQuickEdit} disabled={isSaving} className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors disabled:opacity-50" title="Cancelar">
                        <X className="w-3.5 h-3.5" />
                     </button>
                  </div>
               )}
            </div>
            {type === 'select' ? (
               <select value={String(currentVal || '')} onChange={handleChange} className={selectStyle}>
                  <option value="">- Seleccionar -</option>
                  {options.map((opt: any) => {
                     const optValue = typeof opt === 'string' ? opt : opt.value;
                     const optLabel = typeof opt === 'string' ? opt : opt.label;
                     return <option key={optValue} value={optValue}>{optLabel}</option>;
                  })}
               </select>
            ) : isTextArea ? (
               <textarea value={String(currentVal || '')} onChange={handleChange} rows={3} className={`${inputBaseStyle} resize-none`} autoFocus={isQuickEditing} />
            ) : type === 'date' ? (
               <input
                  type="date"
                  value={currentVal === null || currentVal === undefined ? '' : String(currentVal)}
                  onChange={handleChange}
                  className={`${inputBaseStyle} cursor-pointer ${!currentVal ? 'text-slate-400' : ''}`}
                  style={{ minHeight: '44px' }}
                  autoFocus={isQuickEditing}
               />
            ) : (
               <input
                  type={type}
                  value={currentVal === null || currentVal === undefined ? '' : String(currentVal)}
                  onChange={handleChange}
                  className={inputBaseStyle}
                  placeholder={label === 'Teléfono' ? PHONE_PLACEHOLDER : ''}
                  autoFocus={isQuickEditing}
               />
            )}
            {label === 'Teléfono' && !isQuickEditing && <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{PHONE_HELP_TEXT}</p>}
         </div>
      );
   }

   let displayValue = value;
   if (type === 'select' && label === 'Estado') displayValue = getStatusLabel(value as ClientStatus);
   if (label === 'Tipo Diabetes' && value === 'N/A') displayValue = 'No Diabético';

   return (
      <div className={`mb-3 ${className} group relative`}>
         <div className="flex justify-between items-start">
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">{label}</p>
            {!readOnly && !isEditing && onQuickSave && path && (
               <button
                  onClick={handleStartQuickEdit}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                  title="Edición rápida"
               >
                  <Edit3 className="w-3 h-3" />
               </button>
            )}
         </div>
         <div className={`text-sm text-slate-800 break-words whitespace-pre-line leading-relaxed py-1 ${readOnly ? 'text-slate-600' : ''}`}>
            {type === 'checkbox' ? (
               <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${value ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                  {value ? '✓ Sí' : '✗ No'}
               </span>
            ) : ((displayValue === 0 && !label.toLowerCase().includes('duración') && !label.toLowerCase().includes('importe')) ? <span className="text-slate-300 italic">-</span> : displayValue || (displayValue === 0 ? '0' : <span className="text-slate-300 italic">-</span>))}
            {label.toLowerCase().includes('duración') && value && value !== '-' ? ' meses' : ''}
            {type === 'number' && label.toLowerCase().includes('altura') && value ? ' cm' : ''}
            {type === 'number' && label.toLowerCase().includes('peso') && value ? ' kg' : ''}
         </div>
      </div>
   );
};

// --- RENEWAL CARD ---

export const RenewalCard = ({
   phase, title, contractedPath, durationPath, startDate, endDate, isLast = false,
   formData, isEditing, onUpdate,
   paymentMethod, amount, receiptUrl, amountPath, paymentMethodPath, receiptUrlPath
}: any) => {
   const isContracted = formData.program[contractedPath as keyof typeof formData.program];
   const duration = formData.program[durationPath as keyof typeof formData.program];
   const hasStartDate = !!startDate;

   const getPaymentMethodLabel = (method: string) => {
      switch (method) {
         case 'stripe': return 'Stripe';
         case 'hotmart': return 'Hotmart';
         case 'transferencia': return 'Transferencia';
         case 'paypal': return 'PayPal';
         case 'bizum': return 'Bizum';
         default: return method || '-';
      }
   };

   if (!hasStartDate) {
      return (
         <div className="relative pl-10 pb-8">
            {!isLast && <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-slate-100"></div>}
            <div className="absolute left-0 top-1 w-8 h-8 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
               <Circle className="w-4 h-4 text-slate-300" />
            </div>
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100/50 opacity-60 hover:opacity-100 transition-all duration-300 shadow-sm">
               <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-bold text-slate-500">{title}</h4>
                  <div className="ml-auto">
                     {isEditing ? (
                        <span className="text-xs font-bold text-amber-600 bg-white px-3 py-1.5 border border-amber-200 rounded-lg shadow-sm">Calculando fechas...</span>
                     ) : (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendiente Fase Anterior</span>
                     )}
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <DataField label="Fecha Renovación" value="-" readOnly isEditing={isEditing} onUpdate={onUpdate} />
                  <DataField label="Duración (Meses)" value="-" readOnly isEditing={isEditing} onUpdate={onUpdate} />
                  <DataField label="Fin Contrato (Calc)" value="-" readOnly isEditing={isEditing} onUpdate={onUpdate} />
                  <DataField label="Estado" value="Pendiente" readOnly isEditing={isEditing} onUpdate={onUpdate} />
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="relative pl-10 pb-8">
         {!isLast && <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${isContracted ? 'bg-gradient-to-b from-emerald-300 to-emerald-200' : 'bg-gradient-to-b from-blue-200 to-slate-200'}`}></div>}
         <div className={`absolute left-0 top-1 w-8 h-8 rounded-xl flex items-center justify-center z-10 shadow-md border-2 border-white ${isContracted ? 'bg-gradient-to-br from-emerald-400 to-emerald-500' : 'bg-gradient-to-br from-blue-400 to-blue-500'}`}>
            {isContracted ? <CircleCheck className="w-4 h-4 text-white" /> : <Circle className="w-4 h-4 text-white" />}
         </div>

         <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${isContracted ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white' : 'border-blue-200/80 bg-gradient-to-br from-blue-50/50 to-white'}`}>
            <div className="flex items-center gap-2 mb-3 border-b border-black/5 pb-2">
               <h4 className={`font-bold ${isContracted ? 'text-green-800' : 'text-blue-700'}`}>{title}</h4>
               <div className="ml-auto flex items-center gap-2">
                  {isEditing && (
                     <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1 rounded border border-slate-300 shadow-sm hover:bg-slate-50">
                        <input type="checkbox" checked={!!isContracted} onChange={(e) => onUpdate(`program.${contractedPath}`, e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-xs font-bold text-slate-700">MARCAR CONTRATADO</span>
                     </label>
                  )}
                  {!isEditing && isContracted && <span className="text-xs font-bold text-green-600 uppercase flex items-center gap-1"><CircleCheck className="w-3 h-3" /> CONTRATADO</span>}
                  {!isEditing && !isContracted && <span className="text-xs font-bold text-slate-400 uppercase">PENDIENTE</span>}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <DataField label="Fecha Renovación (Inicio)" value={startDate} readOnly isEditing={isEditing} onUpdate={onUpdate} />
               <DataField label="Duración (Meses)" value={duration} path={`program.${durationPath}`} type="select" options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']} isEditing={isEditing} onUpdate={onUpdate} />
               <DataField label="Fin Contrato (Calc)" value={endDate} readOnly className={endDate ? 'font-semibold text-slate-800' : ''} isEditing={isEditing} onUpdate={onUpdate} />
               <DataField label="Estado Llamada" value={isContracted ? 'Realizada' : 'Pendiente'} readOnly isEditing={isEditing} onUpdate={onUpdate} />
               {formData.program[`contract${phase}_name` as keyof typeof formData.program] && (
                  <div className="col-span-2">
                     <DataField label="Servicio Contratado" value={formData.program[`contract${phase}_name` as keyof typeof formData.program]} readOnly className="font-semibold text-slate-700" isEditing={isEditing} onUpdate={onUpdate} />
                  </div>
               )}
            </div>

            {(isContracted || isEditing) && (
               <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                     <CreditCard className="w-3 h-3" /> Información de Pago
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                     <div>
                        <p className="text-xs text-slate-400 font-medium mb-1">Método</p>
                        {isEditing && paymentMethodPath ? (
                           <select value={paymentMethod || 'stripe'} onChange={(e) => onUpdate(paymentMethodPath, e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                              <option value="stripe">Stripe</option>
                              <option value="hotmart">Hotmart</option>
                              <option value="transferencia">Transferencia</option>
                              <option value="paypal">PayPal</option>
                              <option value="bizum">Bizum</option>
                           </select>
                        ) : (
                           <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${paymentMethod === 'hotmart' ? 'bg-orange-100 text-orange-700' : paymentMethod === 'stripe' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                              {getPaymentMethodLabel(paymentMethod)}
                           </span>
                        )}
                     </div>
                     <div>
                        <p className="text-xs text-slate-400 font-medium mb-1">Importe</p>
                        {isEditing && amountPath ? (
                           <input type="number" value={amount || ''} onChange={(e) => onUpdate(amountPath, parseFloat(e.target.value) || 0)} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        ) : (
                           <span className="text-lg font-black text-slate-800">
                              {amount ? `${amount.toLocaleString()}€` : <span className="text-slate-300 text-sm">-</span>}
                           </span>
                        )}
                     </div>
                     <div>
                        <p className="text-xs text-slate-400 font-medium mb-1">Comprobante</p>
                        {receiptUrl ? (
                           <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                              <FileCheck className="w-3 h-3" /> Ver Documento
                           </a>
                        ) : (
                           <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg">
                              <FileX className="w-3 h-3" /> Sin documento
                           </span>
                        )}
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

// --- SECTION TITLE ---

const getSectionIconStyle = (icon: React.ReactNode): string => {
   const iconType = (icon as any)?.type?.displayName || (icon as any)?.type?.name || '';
   const colorMap: Record<string, string> = {
      'User': 'from-blue-50 to-blue-100 text-blue-600 shadow-blue-100',
      'MapPin': 'from-emerald-50 to-emerald-100 text-emerald-600 shadow-emerald-100',
      'Briefcase': 'from-indigo-50 to-indigo-100 text-indigo-600 shadow-indigo-100',
      'Activity': 'from-red-50 to-red-100 text-red-600 shadow-red-100',
      'HeartPulse': 'from-pink-50 to-pink-100 text-pink-500 shadow-pink-100',
      'Clock': 'from-amber-50 to-amber-100 text-amber-600 shadow-amber-100',
      'Zap': 'from-blue-50 to-blue-100 text-blue-600 shadow-blue-100',
      'Utensils': 'from-green-50 to-green-100 text-green-600 shadow-green-100',
      'AlertCircle': 'from-indigo-50 to-indigo-100 text-indigo-500 shadow-indigo-100',
      'TrendingUp': 'from-blue-50 to-blue-100 text-blue-600 shadow-blue-100',
      'Dumbbell': 'from-slate-100 to-slate-200 text-slate-700 shadow-slate-200',
      'Target': 'from-indigo-50 to-indigo-100 text-indigo-500 shadow-indigo-100',
      'FileText': 'from-slate-100 to-slate-200 text-slate-700 shadow-slate-200',
      'CircleCheck': 'from-emerald-50 to-emerald-100 text-emerald-500 shadow-emerald-100',
   };
   return colorMap[iconType] || 'from-slate-50 to-slate-100 text-slate-600 shadow-slate-100';
};

export const SectionTitle = ({ title, icon, className = "" }: { title: string, icon: React.ReactNode, className?: string }) => (
   <div className={`flex items-center gap-3 mb-5 pb-3 border-b border-slate-100/80 ${className}`}>
      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${getSectionIconStyle(icon)} shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105`}>
         {icon}
      </div>
      <div className="flex-1">
         <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{title}</h3>
         <div className="h-0.5 w-12 bg-gradient-to-r from-slate-300 to-transparent rounded-full mt-1"></div>
      </div>
   </div>
);

// --- TAB BUTTON ---

export const TabButton = ({ id, label, icon, isActive, onClick }: { id: string, label: string, icon: React.ReactNode, isActive: boolean, onClick: (id: any) => void }) => (
   <button
      onClick={() => onClick(id)}
      data-tour={`tab-${id}`}
      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${isActive
         ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-900/25 transform scale-[1.02] ring-2 ring-slate-900/10 ring-offset-2'
         : 'bg-white/80 backdrop-blur-sm text-slate-500 hover:bg-white hover:text-slate-700 border border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
         }`}
   >
      <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>{icon}</span>
      <span>{label}</span>
   </button>
);

// --- REVIEW COMPLIANCE SUMMARY ---

export const ReviewComplianceSummary = ({ checkins, missedCount = 0 }: { checkins: WeeklyCheckin[], missedCount?: number }) => {
   const getCheckinDeadlines = (count: number = 5) => {
      const deadlines = [];
      const now = new Date();
      const currentDay = now.getDay();
      const daysSinceFriday = (currentDay + 7 - 5) % 7;
      const lastFriday = new Date(now);
      lastFriday.setDate(now.getDate() - daysSinceFriday);
      lastFriday.setHours(0, 0, 0, 0);

      for (let i = -1; i < count - 1; i++) {
         const friday = new Date(lastFriday);
         friday.setDate(lastFriday.getDate() - (i * 7));
         const nextThursday = new Date(friday);
         nextThursday.setDate(friday.getDate() + 6);
         nextThursday.setHours(23, 59, 59, 999);
         const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
         deadlines.push({
            start: friday,
            end: nextThursday,
            label: `${friday.getDate()} ${monthNames[friday.getMonth()]}`,
            isFuture: friday > now,
            isCurrent: now >= friday && now <= nextThursday
         });
      }
      return deadlines;
   };

   const deadlines = getCheckinDeadlines();

   return (
      <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col gap-4">
         <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <History className="w-3.5 h-3.5" />
               Seguimiento de Revisiones
            </h4>
            {missedCount > 0 && (
               <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-full animate-pulse">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                  <span className="text-[10px] font-black text-rose-600 uppercase">{missedCount} FALLOS</span>
               </div>
            )}
         </div>

         <div className="flex gap-2">
            {deadlines.map((dl, i) => {
               const hasCheckin = checkins.some(c => {
                  const d = new Date(c.created_at);
                  return d >= dl.start && d <= dl.end;
               });
               const isPending = dl.isFuture || (dl.isCurrent && !hasCheckin);

               return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                     <div
                        title={`${dl.label}: ${hasCheckin ? 'Enviada' : isPending ? 'Próximamente' : 'No enviada'}`}
                        className={`w-full h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${hasCheckin
                           ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-emerald-100'
                           : isPending
                              ? 'bg-white border-2 border-dashed border-slate-200 text-slate-400 shadow-none'
                              : 'bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-rose-100'
                           }`}
                     >
                        {hasCheckin ? <CircleCheck className="w-4 h-4" /> : isPending ? <Clock className="w-3.5 h-3.5 opacity-50" /> : <FileX className="w-4 h-4" />}
                     </div>
                     <span className={`text-[9px] font-bold ${dl.isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                        {dl.label}
                     </span>
                  </div>
               );
            })}
         </div>
         <p className="text-[9px] text-slate-400 mt-4 italic leading-tight bg-white/50 p-2 rounded-lg border border-slate-100">
            * El contador de fallos indica cuántas veces el sistema ha generado una alerta por falta de revisión.
         </p>
      </div>
   );
};

// --- QUICK METRIC CARD ---

export interface QuickMetricCardProps {
   icon: React.ReactNode;
   label: string;
   value: string | number | null | undefined;
   subValue?: string;
   trend?: 'up' | 'down' | 'neutral';
   color: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'orange';
   alert?: boolean;
}

export const QuickMetricCard = ({ icon, label, value, subValue, trend, color, alert }: QuickMetricCardProps) => {
   const colorClasses = {
      blue: 'from-blue-50 to-indigo-50 border-blue-100 text-blue-600',
      emerald: 'from-emerald-50 to-teal-50 border-emerald-100 text-emerald-600',
      amber: 'from-amber-50 to-orange-50 border-amber-100 text-amber-600',
      red: 'from-red-50 to-rose-50 border-red-100 text-red-600',
      purple: 'from-purple-50 to-indigo-50 border-purple-100 text-purple-600',
      orange: 'from-orange-50 to-amber-50 border-orange-100 text-orange-600'
   };

   const iconBgClasses = {
      blue: 'bg-blue-500',
      emerald: 'bg-emerald-500',
      amber: 'bg-amber-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500'
   };

   return (
      <div className={`relative bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border transition-all hover:shadow-md ${alert ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}>
         {alert && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
         )}
         <div className="flex items-start gap-3">
            <div className={`p-2 ${iconBgClasses[color]} rounded-lg text-white shadow-sm`}>
               {icon}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
               <p className="text-xl font-black text-slate-800 truncate">
                  {value ?? '-'}
                  {trend && (
                     <span className={`ml-1 text-xs ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                     </span>
                  )}
               </p>
               {subValue && (
                  <p className="text-[10px] text-slate-500 truncate">{subValue}</p>
               )}
            </div>
         </div>
      </div>
   );
};
