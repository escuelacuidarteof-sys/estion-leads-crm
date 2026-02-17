// ============================================
// CONTRACT TEMPLATE - Single source of truth
// Uses BUSINESS_CONFIG for all business-specific data
// ============================================

import { BUSINESS_CONFIG } from '../config/business';

export interface ContractData {
  fechaDia: string;
  fechaMes: string;
  fechaAno: string;
  nombreCliente: string;
  dniCliente: string;
  domicilioCliente: string;
  duracionMeses: number;
  duracionDias: number;
  importe: number;
  financiacionPlazos: number;
  financiacionImporte: number;
}

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export function getMesesList(): string[] {
  return MESES_ES;
}

export function generateContractHTML(data: ContractData): string {
  const {
    fechaDia, fechaMes, fechaAno,
    nombreCliente, dniCliente, domicilioCliente,
    importe, financiacionPlazos, financiacionImporte
  } = data;

  const headerStyle = "text-align: center; color: #065f46; font-weight: 800; font-size: 1.25rem; margin-bottom: 2rem; text-decoration: underline; text-underline-offset: 8px;";
  const sectionTitle = "font-weight: 700; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.75rem; font-size: 0.9rem; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;";
  const bodyText = "font-size: 0.85rem; line-height: 1.6; color: #334155; text-align: justify;";
  const highlight = "font-weight: 700; color: #0f172a;";

  return `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
      <!-- CABECERA -->
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="/logo.png" alt="Escuela Cuidarte" style="width: 120px; height: auto; margin-bottom: 10px;" />
        <h1 style="${headerStyle}">DOCUMENTO DE ADHESI\u00d3N AL PROGRAMA<br/>ESCUELA CUIDARTE</h1>
      </div>

      <!-- INTRODUCCI\u00d3N -->
      <div style="${bodyText} margin-bottom: 24px;">
        <p style="margin-bottom: 16px;">En <strong>Espa\u00f1a</strong>, a <strong>${fechaDia || '____'}</strong> de <strong>${fechaMes || '________'}</strong> de <strong>${fechaAno || '202_'}</strong></p>

        <p style="${sectionTitle}">REUNIDOS</p>
        
        <p style="margin-bottom: 12px;"><strong>De una parte:</strong></p>
        <p style="margin-bottom: 16px; padding-left: 20px;">
          <strong style="${highlight}">NEIKO HEALTH, S.L.</strong>, con NIF: <strong style="${highlight}">B22928311</strong> y domicilio social en <strong style="${highlight}">C/ Princesa 31, 2\u00ba puerta 2, 28008 Madrid</strong>.<br/>
          Entidad mercantil que presta, gestiona y factura los servicios del programa Escuela CUIDARTE (en adelante, <strong style="${highlight}">LA EMPRESA</strong>).
        </p>

        <p style="margin-bottom: 12px;"><strong>Y de otra parte:</strong></p>
        <p style="margin-bottom: 16px; padding-left: 20px;">
          El/la participante, <strong style="${highlight}">${nombreCliente || '________________________'}</strong> con DNI <strong style="${highlight}">${dniCliente || '____________'}</strong> y domicilio en <strong style="${highlight}">${domicilioCliente || '__________________________________________'}</strong> (en adelante <strong style="${highlight}">EL/LA PARTICIPANTE</strong>).
        </p>

        <p>Ambas partes, reconoci\u00e9ndose capacidad legal suficiente para contratar, acuerdan suscribir el presente Contrato de Prestaci\u00f3n de Servicios, que se regir\u00e1 por las siguientes:</p>
      </div>

      <!-- CLAUSULAS -->
      <div style="${bodyText}">
        <p style="${sectionTitle}">1. OBJETO DEL CONTRATO</p>
        <p>El presente contrato tiene por objeto regular la participaci\u00f3n voluntaria del/la participante en el programa Escuela CUIDARTE, consistente en un servicio integral de acompa\u00f1amiento personalizado en nutrici\u00f3n, ejercicio f\u00edsico y bienestar, desarrollado en modalidad online, y prestado y facturado por LA EMPRESA.</p>

        <p style="${sectionTitle}">2. NATURALEZA DEL SERVICIO</p>
        <p>El/la participante ha sido informado, reconoce y acepta que:</p>
        <ul style="margin-top: 8px; padding-left: 24px;">
          <li>La Escuela CUIDARTE es un programa de educaci\u00f3n, formaci\u00f3n, acompa\u00f1amiento y apoyo en h\u00e1bitos de vida saludable.</li>
          <li>NO constituye un acto m\u00e9dico, psicol\u00f3gico ni terap\u00e9utico.</li>
          <li>NO realiza ni sustituye diagn\u00f3sticos, tratamientos m\u00e9dicos, quir\u00fargicos o farmacol\u00f3gicos prescritos por profesionales sanitarios.</li>
          <li>La informaci\u00f3n que se proporciona a trav\u00e9s del programa tiene car\u00e1cter general y orientativo.</li>
          <li>La participaci\u00f3n en el programa no genera relaci\u00f3n cl\u00ednica ni asistencial con LA EMPRESA.</li>
        </ul>

        <p style="${sectionTitle}">3. NO SUSTITUCI\u00d3N DEL TRATAMIENTO M\u00c9DICO</p>
        <p>El/la participante ha sido informado, reconoce y acepta que:</p>
        <ul style="margin-top: 8px; padding-left: 24px;">
          <li>El programa NO sustituye en ning\u00fan caso a la atenci\u00f3n m\u00e9dica, quir\u00fargica, farmacol\u00f3gica u oncol\u00f3gica indicada por su equipo sanitario.</li>
          <li>Debe mantener sus controles m\u00e9dicos habituales durante toda su participaci\u00f3n en el programa.</li>
          <li>Cualquier decisi\u00f3n relacionada con tratamientos m\u00e9dicos debe ser consultada con su onc\u00f3logo/a o profesional sanitario de referencia.</li>
        </ul>

        <p style="${sectionTitle}">4. AUSENCIA DE SERVICIO DE URGENCIAS</p>
        <p>La Escuela CUIDARTE NO es un servicio de urgencias. No se ofrece atenci\u00f3n inmediata ante situaciones de emergencia. Ante cualquier empeoramiento cl\u00ednico, s\u00edntoma grave o urgencia, deber\u00e1 acudir a los servicios sanitarios correspondientes.</p>

        <p style="${sectionTitle}">5. NO GARANT\u00cdA DE RESULTADOS NI CURACI\u00d3N</p>
        <p>El programa no garantiza resultados m\u00e9dicos, cl\u00ednicos ni terap\u00e9uticos. No asegura o promete ning\u00fan tipo de curaci\u00f3n, mejor\u00eda cl\u00ednica espec\u00edfica ni evoluci\u00f3n determinada de la enfermedad.</p>

        <p style="${sectionTitle}">6. PARTICIPACI\u00d3N VOLUNTARIA Y AUTORRESPONSABILIDAD</p>
        <p>El/la participante acepta que su participaci\u00f3n es voluntaria y bajo su propia responsabilidad. La aplicaci\u00f3n de las recomendaciones es una decisi\u00f3n personal.</p>

        <p style="${sectionTitle}">7. DESCRIPCI\u00d3N DEL PROGRAMA Y CONTENIDOS</p>
        <p>El programa incluye: acompa\u00f1amiento nutricional personalizado, entrenamientos personalizados, formaci\u00f3n en autocuidado y bienestar, y resoluci\u00f3n de dudas.</p>

        <p style="${sectionTitle}">8. ACCESO AL PROGRAMA</p>
        <p>El acceso es v\u00eda plataforma online privada. LA EMPRESA facilitar\u00e1 las credenciales personales tras la aceptaci\u00f3n de este contrato.</p>

        <p style="${sectionTitle}">9. OBLIGACIONES DE LA EMPRESA</p>
        <p>LA EMPRESA se obliga a facilitar los servicios se\u00f1alados y cumplir las obligaciones estipuladas en este contrato.</p>

        <p style="${sectionTitle}">10. PRECIO DEL PROGRAMA</p>
        <p>El precio pactado es de <strong style="${highlight}">${importe || '500,00'} \u20ac</strong> (IVA no incluido) ${financiacionPlazos > 1 ? `en ${financiacionPlazos} plazos de ${financiacionImporte} \u20ac` : 'en un \u00fanico pago'}. El pago debe realizarse en un m\u00e1ximo de 2 d\u00edas naturales tras la aceptaci\u00f3n.</p>

        <p style="${sectionTitle}">11. DURACI\u00d3N Y BAJA</p>
        <p>Duraci\u00f3n m\u00ednima de tres meses. Renovable autom\u00e1ticamente por per\u00edodos iguales. El participante puede abandonar en cualquier momento notific\u00e1ndolo por escrito.</p>

        <p style="${sectionTitle}">12. LIMITACI\u00d3N DE RESPONSABILIDAD</p>
        <p>LA EMPRESA no ser\u00e1 responsable de decisiones personales basadas en los contenidos del programa ni de la evoluci\u00f3n cl\u00ednica del participante.</p>

        <p style="${sectionTitle}">13. CONFIDENCIALIDAD Y PROTECCI\u00d3N DE DATOS</p>
        <p>Tratamiento conforme al RGPD (UE) 2016/679. Los datos se utilizar\u00e1n exclusivamente para la gesti\u00f3n y mejora del programa.</p>

        <p style="${sectionTitle}">14. LEGISLACI\u00d3N Y JURISDICCI\u00d3N</p>
        <p>El contrato se rige por la legislación española. Ambas partes se someten a los Tribunales de Madrid.</p>
      </div>

      <!-- FIRMAS -->
      <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 30px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <p style="font-size: 10px; color: #64748b; margin-bottom: 5px;">POR LA EMPRESA:</p>
              <p style="font-weight: 700; font-size: 12px; color: #0f172a;">NEIKO HEALTH, S.L.</p>
              <div style="margin-top: 10px;">
                <img src="/signature_neiko.png" alt="Sello Empresa" style="width: 100px; height: auto; opacity: 0.8;" onerror="this.style.display='none'" />
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <p style="font-size: 10px; color: #64748b; margin-bottom: 5px;">EL/LA PARTICIPANTE:</p>
              <p style="font-weight: 700; font-size: 12px; color: #0f172a;">${nombreCliente || '________________'}</p>
              <p style="font-size: 10px; color: #64748b;">DNI: ${dniCliente || '________________'}</p>
              <div style="margin-top: 15px; border: 1px dashed #cbd5e1; height: 60px; display: inline-block; width: 200px; position: relative;">
                <p style="font-size: 9px; color: #94a3b8; margin-top: 20px; text-align: center;">Firma Digital Registrada</p>
              </div>
            </td>
          </tr>
        </table>
        <p style="font-size: 9px; color: #94a3b8; text-align: center; margin-top: 30px;">
          Documento generado electr\u00f3nicamente. Fecha de aceptaci\u00f3n registrada en el sistema.
        </p>
      </div>
    </div>
  `;
}

export function calculateDaysFromMonths(months: number): number {
  return Math.round(months * 30.44);
}
