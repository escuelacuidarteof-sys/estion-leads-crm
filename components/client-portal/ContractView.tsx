import React, { useState } from 'react';
import { ChevronRight, FileText, CircleCheck, AlertCircle, Download, Loader2 } from 'lucide-react';
import { Client } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { SignaturePad } from '../shared/SignaturePad';
import { useToast } from '../ToastProvider';
import { generateContractHTML, calculateDaysFromMonths, getMesesList, ContractData } from '../../utils/contractTemplate';
import jsPDF from 'jspdf';

interface ContractViewProps {
    client: Client;
    onBack: () => void;
    onRefresh?: () => void;
    readOnly?: boolean;
}

export function ContractView({ client, onBack, onRefresh, readOnly = false }: ContractViewProps) {
    const toast = useToast();
    const [accepted, setAccepted] = useState(false);
    const [healthConsent, setHealthConsent] = useState(false);
    const [signatureData, setSignatureData] = useState('');
    const [isSigning, setIsSigning] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [wasSignedSuccessfully, setWasSignedSuccessfully] = useState(false);

    const isSigned = client.program?.contract_signed || wasSignedSuccessfully;
    const signedAt = wasSignedSuccessfully ? new Date().toISOString() : client.program?.contract_signed_at;
    const signatureImage = wasSignedSuccessfully ? signatureData : client.program?.contract_signature_image;

    // Build contract data from client fields
    const program = client.program || {} as any;
    const meses = getMesesList();
    const contractDate = program.contract_date || '';
    // Fallback: contract_date → contract_signed_at → today
    const resolvedDate = contractDate
        ? new Date(contractDate + 'T00:00:00')
        : (program.contract_signed_at
            ? new Date(program.contract_signed_at)
            : new Date());
    const parsedDate = resolvedDate;

    const duracionMeses = client.program_duration_months || 3;
    const clientName = `${client.firstName || ''} ${client.surname || ''}`.trim();
    const clientDni = client.idNumber || '';
    const clientAddress = client.address || '';
    const importeTotal = program.contract_amount || 0;
    const finPlazos = program.contract_financing_installments || 0;
    const finImporte = program.contract_financing_amount || 0;

    const contractData: ContractData = {
        fechaDia: parsedDate.getDate().toString(),
        fechaMes: meses[parsedDate.getMonth()],
        fechaAno: parsedDate.getFullYear().toString(),
        nombreCliente: clientName,
        dniCliente: clientDni,
        domicilioCliente: clientAddress,
        duracionMeses: duracionMeses,
        duracionDias: calculateDaysFromMonths(duracionMeses),
        importe: importeTotal,
        financiacionPlazos: finPlazos,
        financiacionImporte: finImporte
    };

    const contractHTML = generateContractHTML(contractData);

    const handleSign = async () => {
        if (!signatureData) {
            toast.error('Debes firmar antes de continuar');
            return;
        }
        if (!accepted) {
            toast.error('Debes aceptar los términos del contrato');
            return;
        }
        if (!healthConsent) {
            toast.error('Debes aceptar el tratamiento de datos de salud');
            return;
        }

        setIsSigning(true);
        try {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('clientes')
                .update({
                    contract_signed: true,
                    contract_signed_at: now,
                    contract_signature_image: signatureData
                })
                .eq('id', client.id)
                .select();

            if (error) {
                toast.error(`Error de base de datos: ${error.message}`);
                throw error;
            }

            if (!data || data.length === 0) {
                toast.error('No se pudo guardar la firma. Contacta con soporte.');
                return;
            }

            setWasSignedSuccessfully(true);
            toast.success('Contrato firmado correctamente');
            if (onRefresh) onRefresh();
        } catch (err: any) {
            console.error('Error signing contract:', err);
            toast.error(`Error al firmar: ${err.message || 'Error desconocido'}`);
        } finally {
            setIsSigning(false);
        }
    };

    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const marginL = 20;
            const marginR = 20;
            const marginTop = 15;
            const marginBottom = 20;
            const contentW = pageW - marginL - marginR;
            let y = marginTop;
            let pageNum = 1;

            const addNewPageIfNeeded = (requiredSpace: number) => {
                if (y + requiredSpace > pageH - marginBottom) {
                    // Footer on current page
                    addFooter();
                    doc.addPage();
                    pageNum++;
                    y = marginTop;
                }
            };

            const addFooter = () => {
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(160, 160, 160);
                doc.text('Escuela Cuid-Arte — Contrato de Prestación de Servicios', marginL, pageH - 10);
                doc.text(`Página ${pageNum}`, pageW - marginR, pageH - 10, { align: 'right' });
            };

            // Helper for paragraph text
            const addParagraph = (text: string, fontSize: number = 9, indent: number = 0) => {
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(51, 65, 85); // slate-700
                const lines = doc.splitTextToSize(text, contentW - indent);
                for (let i = 0; i < lines.length; i++) {
                    addNewPageIfNeeded(5);
                    doc.text(lines[i], marginL + indent, y);
                    y += fontSize * 0.5;
                }
                y += 2;
            };

            // Helper for section title
            const addSectionTitle = (text: string) => {
                addNewPageIfNeeded(14);
                y += 4;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42); // slate-900
                doc.text(text, marginL, y);
                y += 1;
                // Underline
                doc.setDrawColor(226, 232, 240); // slate-200
                doc.setLineWidth(0.3);
                doc.line(marginL, y, marginL + contentW, y);
                y += 5;
            };

            // Helper for bullet points
            const addBullet = (text: string) => {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(51, 65, 85);
                const bulletIndent = 8;
                const lines = doc.splitTextToSize(text, contentW - bulletIndent - 4);
                addNewPageIfNeeded(lines.length * 4.5 + 2);
                // Bullet dot
                doc.setFillColor(16, 185, 129); // emerald-500
                doc.circle(marginL + bulletIndent - 2, y - 1.2, 0.8, 'F');
                for (let i = 0; i < lines.length; i++) {
                    doc.text(lines[i], marginL + bulletIndent + 2, y);
                    y += 4.5;
                }
                y += 1;
            };

            // ============================================
            // PAGE 1 — HEADER
            // ============================================

            // Header bar
            doc.setFillColor(16, 185, 129); // emerald-500
            doc.rect(0, 0, pageW, 28, 'F');
            // Subtle gradient overlay
            doc.setFillColor(13, 148, 103);
            doc.rect(0, 22, pageW, 6, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Escuela Cuid-Arte', marginL, 12);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Contrato de Prestación de Servicios', marginL, 19);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(clientName, pageW - marginR, 12, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            const signedDateStr = signedAt ? new Date(signedAt).toLocaleDateString('es-ES') : parsedDate.toLocaleDateString('es-ES');
            doc.text(`Fecha: ${signedDateStr}`, pageW - marginR, 18, { align: 'right' });

            y = 38;

            // ============================================
            // TITLE
            // ============================================
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(6, 95, 70); // emerald-900
            doc.text('DOCUMENTO DE ADHESIÓN AL PROGRAMA', pageW / 2, y, { align: 'center' });
            y += 7;
            doc.text('ESCUELA CUIDARTE', pageW / 2, y, { align: 'center' });
            y += 3;
            // Decorative line under title
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(0.5);
            const titleLineW = 60;
            doc.line(pageW / 2 - titleLineW / 2, y, pageW / 2 + titleLineW / 2, y);
            y += 10;

            // ============================================
            // DATE & PARTIES
            // ============================================
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);

            const fechaText = `En España, a ${contractData.fechaDia} de ${contractData.fechaMes} de ${contractData.fechaAno}`;
            doc.text(fechaText, marginL, y);
            y += 8;

            // REUNIDOS section
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('REUNIDOS', marginL, y);
            y += 6;

            // De una parte
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text('De una parte:', marginL, y);
            y += 5;

            doc.setFont('helvetica', 'normal');
            const empresaLines = doc.splitTextToSize(
                'NEIKO HEALTH, S.L., con NIF: B22928311 y domicilio social en C/ Princesa 31, 2º puerta 2, 28008 Madrid. Entidad mercantil que presta, gestiona y factura los servicios del programa Escuela CUIDARTE (en adelante, LA EMPRESA).',
                contentW - 10
            );
            for (const line of empresaLines) {
                addNewPageIfNeeded(5);
                doc.text(line, marginL + 10, y);
                y += 4.5;
            }
            y += 3;

            // Y de otra parte
            doc.setFont('helvetica', 'bold');
            doc.text('Y de otra parte:', marginL, y);
            y += 5;

            doc.setFont('helvetica', 'normal');
            const clienteText = `El/la participante, ${clientName || '________________________'} con DNI ${clientDni || '____________'} y domicilio en ${clientAddress || '__________________________________________'} (en adelante EL/LA PARTICIPANTE).`;
            const clienteLines = doc.splitTextToSize(clienteText, contentW - 10);
            for (const line of clienteLines) {
                addNewPageIfNeeded(5);
                doc.text(line, marginL + 10, y);
                y += 4.5;
            }
            y += 4;

            addParagraph('Ambas partes, reconociéndose capacidad legal suficiente para contratar, acuerdan suscribir el presente Contrato de Prestación de Servicios, que se regirá por las siguientes:');

            // ============================================
            // CONTRACT CLAUSES
            // ============================================

            addSectionTitle('1. OBJETO DEL CONTRATO');
            addParagraph('El presente contrato tiene por objeto regular la participación voluntaria del/la participante en el programa Escuela CUIDARTE, consistente en un servicio integral de acompañamiento personalizado en nutrición, ejercicio físico y bienestar, desarrollado en modalidad online, y prestado y facturado por LA EMPRESA.');

            addSectionTitle('2. NATURALEZA DEL SERVICIO');
            addParagraph('El/la participante ha sido informado, reconoce y acepta que:');
            addBullet('La Escuela CUIDARTE es un programa de educación, formación, acompañamiento y apoyo en hábitos de vida saludable.');
            addBullet('NO constituye un acto médico, psicológico ni terapéutico.');
            addBullet('NO realiza ni sustituye diagnósticos, tratamientos médicos, quirúrgicos o farmacológicos prescritos por profesionales sanitarios.');
            addBullet('La información que se proporciona a través del programa tiene carácter general y orientativo.');
            addBullet('La participación en el programa no genera relación clínica ni asistencial con LA EMPRESA.');

            addSectionTitle('3. NO SUSTITUCIÓN DEL TRATAMIENTO MÉDICO');
            addParagraph('El/la participante ha sido informado, reconoce y acepta que:');
            addBullet('El programa NO sustituye en ningún caso a la atención médica, quirúrgica, farmacológica u oncológica indicada por su equipo sanitario.');
            addBullet('Debe mantener sus controles médicos habituales durante toda su participación en el programa.');
            addBullet('Cualquier decisión relacionada con tratamientos médicos debe ser consultada con su oncólogo/a o profesional sanitario de referencia.');

            addSectionTitle('4. AUSENCIA DE SERVICIO DE URGENCIAS');
            addParagraph('La Escuela CUIDARTE NO es un servicio de urgencias. No se ofrece atención inmediata ante situaciones de emergencia. Ante cualquier empeoramiento clínico, síntoma grave o urgencia, deberá acudir a los servicios sanitarios correspondientes.');

            addSectionTitle('5. NO GARANTÍA DE RESULTADOS NI CURACIÓN');
            addParagraph('El programa no garantiza resultados médicos, clínicos ni terapéuticos. No asegura o promete ningún tipo de curación, mejoría clínica específica ni evolución determinada de la enfermedad.');

            addSectionTitle('6. PARTICIPACIÓN VOLUNTARIA Y AUTORRESPONSABILIDAD');
            addParagraph('El/la participante acepta que su participación es voluntaria y bajo su propia responsabilidad. La aplicación de las recomendaciones es una decisión personal.');

            addSectionTitle('7. DESCRIPCIÓN DEL PROGRAMA Y CONTENIDOS');
            addParagraph('El programa incluye: acompañamiento nutricional personalizado, entrenamientos personalizados, formación en autocuidado y bienestar, y resolución de dudas.');

            addSectionTitle('8. ACCESO AL PROGRAMA');
            addParagraph('El acceso es vía plataforma online privada. LA EMPRESA facilitará las credenciales personales tras la aceptación de este contrato.');

            addSectionTitle('9. OBLIGACIONES DE LA EMPRESA');
            addParagraph('LA EMPRESA se obliga a facilitar los servicios señalados y cumplir las obligaciones estipuladas en este contrato.');

            addSectionTitle('10. PRECIO DEL PROGRAMA');
            const precioText = finPlazos > 1
                ? `El precio pactado es de ${importeTotal || '500,00'} € (IVA no incluido) en ${finPlazos} plazos de ${finImporte} €. El pago debe realizarse en un máximo de 2 días naturales tras la aceptación.`
                : `El precio pactado es de ${importeTotal || '500,00'} € (IVA no incluido) en un único pago. El pago debe realizarse en un máximo de 2 días naturales tras la aceptación.`;
            addParagraph(precioText);

            addSectionTitle('11. DURACIÓN Y BAJA');
            addParagraph(`Duración mínima de ${duracionMeses} meses (${calculateDaysFromMonths(duracionMeses)} días). Renovable automáticamente por períodos iguales. El participante puede abandonar en cualquier momento notificándolo por escrito.`);

            addSectionTitle('12. LIMITACIÓN DE RESPONSABILIDAD');
            addParagraph('LA EMPRESA no será responsable de decisiones personales basadas en los contenidos del programa ni de la evolución clínica del participante.');

            addSectionTitle('13. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS');
            addParagraph('Tratamiento conforme al RGPD (UE) 2016/679. Los datos se utilizarán exclusivamente para la gestión y mejora del programa.');

            addSectionTitle('14. LEGISLACIÓN Y JURISDICCIÓN');
            addParagraph('El contrato se rige por la legislación española. Ambas partes se someten a los Tribunales de Madrid.');

            // ============================================
            // SIGNATURES SECTION
            // ============================================
            addNewPageIfNeeded(80);
            y += 10;

            // Decorative top border
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(0.5);
            doc.line(marginL, y, marginL + contentW, y);
            y += 8;

            // Two-column signature layout
            const colW = contentW / 2 - 5;
            const colLeft = marginL;
            const colRight = marginL + contentW / 2 + 5;
            const sigBoxH = 30;

            // === LEFT: Empresa ===
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text('POR LA EMPRESA:', colLeft, y);

            // === RIGHT: Cliente ===
            doc.text('EL/LA PARTICIPANTE:', colRight, y);
            y += 5;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('NEIKO HEALTH, S.L.', colLeft, y);
            doc.text(clientName || '________________', colRight, y);
            y += 4;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text('NIF: B22928311', colLeft, y);
            doc.text(`DNI: ${clientDni || '________________'}`, colRight, y);
            y += 6;

            // Signature boxes
            const sigBoxY = y;

            // Company signature box
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.2);
            doc.roundedRect(colLeft, sigBoxY, colW, sigBoxH, 2, 2, 'S');

            // Try to embed company signature
            try {
                // Preload image
                const imgResponse = await fetch('/firma_neiko.jpeg');
                const imgBlob = await imgResponse.blob();
                const imgDataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(imgBlob);
                });
                doc.addImage(imgDataUrl, 'JPEG', colLeft + 5, sigBoxY + 3, colW - 10, sigBoxH - 6);
            } catch (e) {
                console.warn('Could not add company signature to PDF', e);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text('Firma Digital', colLeft + colW / 2, sigBoxY + sigBoxH / 2, { align: 'center' });
            }

            // Client signature box
            doc.roundedRect(colRight, sigBoxY, colW, sigBoxH, 2, 2, 'S');

            if (signatureImage || signatureData) {
                const sigImg = signatureImage || signatureData;
                try {
                    doc.addImage(sigImg, 'PNG', colRight + 5, sigBoxY + 3, colW - 10, sigBoxH - 6);
                } catch { /* ignore */ }
            } else {
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text('Pendiente de Firma', colRight + colW / 2, sigBoxY + sigBoxH / 2, { align: 'center' });
            }

            y = sigBoxY + sigBoxH + 6;

            // Labels under signature boxes
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('Empresa (Sello/Firma)', colLeft + colW / 2, y, { align: 'center' });
            doc.text('Cliente (Firma Digital)', colRight + colW / 2, y, { align: 'center' });
            y += 6;

            // Signed electronically note
            if (isSigned) {
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(148, 163, 184);
                const signedDateFull = signedAt ? new Date(signedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha no registrada';
                doc.text(`Firmado electrónicamente por ${clientName} — ${signedDateFull}`, colRight + colW / 2, y, { align: 'center' });
            }

            y += 10;

            // Final document note
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text('Documento generado electrónicamente. Fecha de aceptación registrada en el sistema.', pageW / 2, y, { align: 'center' });

            // Add footer to last page
            addFooter();

            doc.save(`Contrato_${clientName.replace(/\s+/g, '_')}.pdf`);
            toast.success('PDF descargado');
        } catch (err) {
            console.error('Error generating PDF:', err);
            toast.error('Error al generar el PDF');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4">
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold group">
                <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
            </button>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Mi Contrato</h2>
                    <p className="text-slate-500 text-sm">
                        {isSigned ? 'Contrato firmado' : 'Pendiente de firma'}
                    </p>
                </div>
            </div>

            {/* Signed Status Card */}
            {isSigned && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <CircleCheck className="w-8 h-8 text-emerald-500" />
                        <div>
                            <p className="font-bold text-emerald-900">Contrato Firmado</p>
                            <p className="text-sm text-emerald-700">
                                Firmado el {signedAt ? new Date(signedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGeneratingPdf}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-bold shadow-lg shadow-emerald-200 disabled:opacity-50"
                    >
                        {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Descargar PDF
                    </button>
                </div>
            )}

            {/* Contract Content */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden mb-6">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 opacity-80"></div>
                <div className="prose prose-slate prose-sm max-w-none text-justify leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: contractHTML }} />

                    {/* Signature Section */}
                    <div className="mt-12 grid grid-cols-2 gap-12">
                        <div className="text-center space-y-4">
                            <div className="h-32 border-b border-slate-300 flex items-center justify-center p-2">
                                <img
                                    src="/firma_neiko.jpeg"
                                    alt="Firma empresa"
                                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                                    onError={(e) => {
                                        (e.target as any).style.display = 'none';
                                        (e.target as any).parentElement.innerHTML = '<span class="italic text-slate-400">Escuela Cuid-Arte</span>';
                                    }}
                                />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Empresa (Sello/Firma)</p>
                        </div>
                        <div className="text-center space-y-4">
                            <div className="h-32 border-b border-slate-300 flex items-center justify-center p-2">
                                {(signatureImage || signatureData) ? (
                                    <img
                                        src={signatureImage || signatureData}
                                        alt="Firma del Cliente"
                                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                                    />
                                ) : (
                                    <span className="text-xs italic text-slate-400">Pendiente de Firma</span>
                                )}
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Cliente (Firma Digital)</p>
                            {isSigned && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                    FIRMADO ELECTRONICAMENTE POR {client.firstName} {client.surname}<br />
                                    {signedAt || 'Fecha no registrada'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Signing Area - Only show if NOT signed */}
            {!isSigned && !readOnly && (
                <div className="space-y-4">
                    {/* RGPD Consent */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="text-blue-900 font-bold text-xs uppercase mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Protección de Datos de Salud (RGPD)
                        </h4>
                        <p className="text-[11px] text-blue-800 leading-normal text-justify mb-3">
                            Para poder ofrecerte un servicio personalizado, necesitamos tratar tus datos de categoría especial (glucosa, peso, medicación, etc.). Estos datos serán visibles exclusivamente para tu Coach y el equipo médico de la Academia, y no serán compartidos con terceros sin tu permiso expreso.
                        </p>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 text-blue-600 rounded mt-0.5"
                                checked={healthConsent}
                                onChange={(e) => setHealthConsent(e.target.checked)}
                            />
                            <span className="text-xs font-bold text-blue-900">Consiento expresamente el tratamiento de mis datos de salud para la ejecución del programa. *</span>
                        </label>
                    </div>

                    {/* Accept Terms */}
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                        <input
                            type="checkbox"
                            className="w-5 h-5 text-emerald-600 rounded"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                        />
                        <span className="text-sm text-slate-700">He leído y acepto los términos del contrato de colaboración.</span>
                    </label>

                    {/* Signature Pad */}
                    {accepted && healthConsent && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4">
                            <SignaturePad
                                onSignatureCapture={(data) => setSignatureData(data)}
                                onClear={() => setSignatureData('')}
                            />

                            <button
                                onClick={handleSign}
                                disabled={isSigning || !signatureData}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSigning ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Firmando...</>
                                ) : (
                                    <><CircleCheck className="w-5 h-5" /> Firmar Contrato</>
                                )}
                            </button>
                        </div>
                    )}

                    {(!accepted || !healthConsent) && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <p className="text-amber-700 text-xs italic">Debes aceptar ambas casillas para poder firmar el contrato.</p>
                        </div>
                    )}
                </div>
            )}

            {!isSigned && readOnly && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <p className="text-amber-700 text-sm">Este contrato está en modo solo lectura en el portal. Si necesitas firmarlo o actualizar datos, escríbenos y te ayudamos.</p>
                </div>
            )}
        </div>
    );
}
