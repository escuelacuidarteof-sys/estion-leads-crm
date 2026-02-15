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

function formatImporteDecimal(amount: number): string {
  return amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatImporteEntero(amount: number): string {
  return amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function buildFinanciacionTexto(plazos: number, importePorPlazo: number): string {
  if (!plazos || plazos <= 1) {
    return 'En caso de tener posibilidad de financiaci\u00f3n, se determinar\u00e1n los plazos y la cantidad de cada plazo en la misma llamada de admisi\u00f3n, quedando estos como cumplimiento obligatorio por ambas partes.';
  }
  return `El pago se realizar\u00e1 en ${plazos} plazos de ${formatImporteDecimal(importePorPlazo)} euros cada uno, quedando estos como cumplimiento obligatorio por ambas partes.`;
}

export function generateContractHTML(data: ContractData): string {
  const {
    fechaDia, fechaMes, fechaAno,
    nombreCliente, dniCliente, domicilioCliente,
    duracionMeses, duracionDias, importe,
    financiacionPlazos, financiacionImporte
  } = data;

  const c = BUSINESS_CONFIG.contract;
  const professional = c.responsibleName;
  const companyName = c.companyName;
  const legalId = c.responsibleId || '____________';
  const address = c.companyAddress || '____________';
  const collegiateNum = c.collegiateNumber ? `, con n\u00famero de Colegiado ${c.collegiateNumber}` : '';
  const serviceDesc = c.serviceDescription;

  const importeDecimal = formatImporteDecimal(importe);
  const importeEntero = formatImporteEntero(importe);
  const financiacionTexto = buildFinanciacionTexto(financiacionPlazos, financiacionImporte);
  const durMeses = duracionMeses === 1 ? '1 mes' : `${duracionMeses} meses`;

  // Reusable styles
  const sectionGap = 'margin-top: 32px; margin-bottom: 16px;';
  const clauseStyle = 'margin-bottom: 28px; line-height: 1.8;';
  const clauseTitle = 'font-weight: 800; font-size: 14px; color: #1e293b; margin-bottom: 8px; display: block;';
  const bodyText = 'color: #334155; font-size: 13px; line-height: 1.8; text-align: justify;';
  const listStyle = 'margin: 12px 0 12px 24px; padding: 0;';
  const listItem = 'margin-bottom: 8px; color: #334155; font-size: 13px; line-height: 1.7;';
  const divider = '<div style="border-top: 1px solid #e2e8f0; margin: 32px 0;"></div>';

  return `
<!-- T\u00cdTULO -->
<div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #10b981;">
  <h2 style="text-transform: uppercase; font-weight: 900; font-size: 20px; color: #0f172a; letter-spacing: 1px; margin: 0 0 8px 0;">CONTRATO PRESTACI\u00d3N DE SERVICIOS DE SALUD Y BIENESTAR ONLINE</h2>
</div>

<!-- ENCABEZADO -->
<div style="${bodyText} margin-bottom: 32px;">
  <p style="margin-bottom: 20px;">En <strong>Espa\u00f1a</strong>, a <strong>${fechaDia}</strong> de <strong>${fechaMes}</strong> de <strong>${fechaAno}</strong></p>

  <p style="margin-bottom: 16px;">De una parte: <strong>${professional}</strong>${collegiateNum}, con DNI: ${legalId} y domicilio social en ${address}.</p>

  <p style="margin-bottom: 16px;">Y de otra: <strong>${nombreCliente || '________________________'}</strong> con DNI <strong>${dniCliente || '____________'}</strong> y domicilio en <strong>${domicilioCliente || '__________________________________________'}</strong> (en adelante \u201cel cliente\u201d).</p>

  <p>INTERVIENEN, ambas partes, en su propio nombre y derecho, aseguran tener y se reconocen mutuamente plena capacidad legal para contratar y obligarse, en especial para este acto y de com\u00fan acuerdo,</p>
</div>

${divider}

<!-- MANIFIESTAN -->
<div style="${sectionGap}">
  <h3 style="font-weight: 900; font-size: 16px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 24px;">MANIFIESTAN:</h3>

  <div style="${clauseStyle}">
    <p style="${bodyText} margin-bottom: 12px;"><strong>I.</strong> Que, ${professional}, presta un servicio denominado \u201c${companyName.toUpperCase()}\u201d por el cual ofrece los siguientes servicios:</p>
    <ul style="${listStyle}">
      <li style="${listItem}">${serviceDesc} de <strong>${duracionDias} d\u00edas</strong> de duraci\u00f3n.</li>
      <li style="${listItem}">Acceso a la plataforma privada durante la duraci\u00f3n del servicio.</li>
      <li style="${listItem}">Soporte por chat privado durante la duraci\u00f3n del programa en el horario establecido en la llamada de admisi\u00f3n.</li>
      <li style="${listItem}">Acceso a plan de acompa\u00f1amiento personalizado junto con control peri\u00f3dico de resultados.</li>
    </ul>
  </div>

  <div style="${clauseStyle}">
    <p style="${bodyText} margin-bottom: 12px;"><strong>II.</strong> Que quedan expresamente excluidos de dicho programa los siguientes servicios:</p>
    <ul style="${listStyle}">
      <li style="${listItem}">Soporte o ayuda v\u00eda chat o acceso a la plataforma o acceso a nuevos planes m\u00e1s all\u00e1 del periodo de tiempo del programa contratado.</li>
      <li style="${listItem}">Acceso a soporte por otros medios que no sean los acordados en la entrevista inicial o m\u00e9todo de pago inicial.</li>
    </ul>
  </div>

  <div style="${clauseStyle}">
    <p style="${bodyText}"><strong>III.</strong> Que dicho servicio tiene un coste de <strong>${importeDecimal} euros</strong> (IVA incluido) durante <strong>${durMeses}</strong>. ${financiacionTexto}</p>
  </div>

  <div style="${clauseStyle}">
    <p style="${bodyText}"><strong>IV.</strong> Que el cliente manifiesta que conoce y acepta los servicios incluidos y excluidos de dicho servicio online, los acepta en todas sus condiciones, estando interesado en la realizaci\u00f3n del mismo y en su consecuente contrataci\u00f3n.</p>
  </div>

  <div style="${clauseStyle}">
    <p style="${bodyText}"><strong>V.</strong> Que, habiendo llegado las partes a un acuerdo satisfactorio sobre el particular, otorgan el presente CONTRATO DE PRESTACI\u00d3N DE SERVICIOS DE SALUD Y BIENESTAR ON-LINE, y a los efectos de establecer las disposiciones y condiciones que unir\u00e1n las partes, tanto ${professional} como el cliente firman el presente contrato, comprometi\u00e9ndose ambas partes a su estricto cumplimiento.</p>
  </div>

  <p style="${bodyText}">El mismo se regir\u00e1 de acuerdo y con sujeci\u00f3n a lo siguientes:</p>
</div>

${divider}

<!-- T\u00c9RMINOS Y CONDICIONES -->
<div style="${sectionGap}">
  <h3 style="font-weight: 900; font-size: 16px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 28px;">T\u00c9RMINOS Y CONDICIONES</h3>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">PRIMERA - Del objeto del contrato.</span>
    <p style="${bodyText} margin-bottom: 10px;">${companyName} tiene como objeto principal la prestaci\u00f3n de servicios de coaching y acompa\u00f1amiento personalizado en salud y bienestar, dirigidos a la mejora integral de la calidad de vida del cliente.</p>
    <p style="${bodyText}">El presente contrato tiene como objeto la prestaci\u00f3n de servicios de acompa\u00f1amiento a distancia, con contenido, duraci\u00f3n y condiciones establecidas en la llamada de acceso previa al programa ya sea con ${professional} o con cualquiera de sus colaboradores.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">SEGUNDA - Del registro de clientes.</span>
    <p style="${bodyText}">Al registrarse el cliente en ${companyName}, en el servicio que este ofrece por el presente instrumento legal, el cliente estar\u00e1 autom\u00e1ticamente adhiri\u00e9ndose y aceptando someterse integralmente a las disposiciones y condiciones del presente contrato.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">TERCERA - De la duraci\u00f3n y vigencia del contrato.</span>
    <p style="${bodyText} margin-bottom: 10px;">Asimismo, el presente contrato tendr\u00e1 vigencia mientras dure el servicio en cuesti\u00f3n hasta la efectiva finalizaci\u00f3n del mismo o hasta el desistimiento de alguna de las partes con las pertinentes consecuencias que ello conlleva.</p>
    <p style="${bodyText}">La duraci\u00f3n del programa (y consecuente duraci\u00f3n del contrato), queda indicada en todos sus t\u00e9rminos en la llamada de acceso previa al programa, donde se establece la fecha de iniciaci\u00f3n del mismo, por lo que, las partes se obligan a cumplir con dicha duraci\u00f3n y todas sus condiciones.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">CUARTA - Del coste.</span>
    <p style="${bodyText} margin-bottom: 10px;">La retribuci\u00f3n pactada de los servicios, y como ya se ha indicado en el expositivo III del presente, asciende a <strong>${importeEntero}\u20ac</strong> (IVA incluido) en un pago \u00fanico o en los fraccionamientos indicados (en caso de haber fraccionamiento).</p>
    <p style="${bodyText}">Toda la informaci\u00f3n pertinente del servicio objeto del presente contrato se da por explicada en la llamada efectuada y en el contenido de este contrato, como primera entrevista entre ambas partes, habiendo entendido el cliente todos sus extremos.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">QUINTA - De las obligaciones del cliente.</span>
    <p style="${bodyText} margin-bottom: 8px;">El cliente se compromete a seguir los modelos de conducta establecidos y vigentes en el presente contrato y siguiendo los principios de la buena fe, se compromete a:</p>
    <ul style="${listStyle}">
      <li style="${listItem}">Cumplir con las indicaciones y planes asignados por el equipo profesional.</li>
      <li style="${listItem}">Realizar los controles de progreso en los tiempos y modo indicados en la llamada inicial.</li>
      <li style="${listItem}">Respetar las v\u00edas de soporte y uso del programa indicadas en la llamada inicial.</li>
      <li style="${listItem}">Completar el programa en el tiempo y forma establecidas en la llamada inicial.</li>
    </ul>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">SEXTA - Supuestos de exenci\u00f3n de responsabilidad.</span>
    <p style="${bodyText}">${companyName} no se responsabiliza por los posibles problemas causados por un mal uso del programa por parte del cliente, por problemas eventuales provenientes de la interrupci\u00f3n de los servicios del proveedor de acceso del cliente, ni por la interrupci\u00f3n de los servicios en el caso de falta de energ\u00eda el\u00e9ctrica para el sistema de su proveedor de acceso, fallos en el sistema de transmisi\u00f3n o de navegaci\u00f3n en el acceso a internet, incompatibilidad de los sistemas de los usuarios con los del proveedor de acceso o cualquier acci\u00f3n de terceros que impidan la prestaci\u00f3n del servicio resultante de caso fortuito, imprevisibles o de fuerza mayor.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">S\u00c9PTIMA - De los derechos de propiedad intelectual.</span>
    <p style="${bodyText} margin-bottom: 10px;">Todos los derechos de propiedad intelectual o industrial sobre el servicio prestado, as\u00ed como su documentaci\u00f3n preparatoria, actualizaciones, documentaci\u00f3n t\u00e9cnica, manuales de uso, son titularidad de ${companyName}, y ello para cualquier idioma y/o lenguaje.</p>
    <p style="${bodyText} margin-bottom: 10px;">${companyName} se encuentra protegido por la legislaci\u00f3n espa\u00f1ola en materia de Propiedad Intelectual e Industrial (Real Decreto Legislativo 1/1996, de 12 de abril).</p>
    <p style="${bodyText}">Por lo que, las partes acuerdan y en especial el cliente se compromete a proteger los derechos de propiedad industrial de ${companyName} y a no difundir, replicar, reproducir ni copiar en ninguna de las formas el contenido del material, instrucciones, t\u00e9cnicas, documentaci\u00f3n o material de cualquier \u00edndole otorgado, bajo el apercibimiento de la responsabilidad civil y penal en la que incurrir\u00eda.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">OCTAVA - Responsabilidad del cliente.</span>
    <p style="${bodyText} margin-bottom: 10px;">El cliente se compromete a hacer un uso responsable de todo el material o indicaciones prestadas por la parte contratada, asegurando hacer un uso del servicio individualizado.</p>
    <p style="${bodyText}">Ello conlleva que el cliente se compromete a que el contenido o acceso al programa no lo va a compartir, ni transferir ni revender a varios usuarios ni a difundir en ning\u00fan momento ni por ninguna v\u00eda el material contenido en el programa.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">NOVENA - Pol\u00edtica de reembolso.</span>
    <p style="${bodyText} margin-bottom: 10px;">Este servicio cuenta con una estricta pol\u00edtica de no reembolso tras el periodo estipulado por ley. Al aceptar el contrato el cliente acepta que no existe ninguna posibilidad de reembolso por causas como desistimiento, abandono del programa por razones propias o cualquier causa ajena a ${companyName}.</p>
    <p style="${bodyText} margin-bottom: 10px;">Asimismo, el cliente tambi\u00e9n se ver\u00e1 obligado a abonar la totalidad del importe del programa si \u00e9l mismo decide abandonar el programa antes de los <strong>${duracionDias} d\u00edas</strong> y no finalizar el programa en cuesti\u00f3n, tanto si hubiera decidido abonar el programa con un pago como a plazos.</p>
    <p style="${bodyText}">Se acuerda por las partes que el hecho de elegir abonar el programa en diferentes plazos, y antes del devengo de alguno de ellos el cliente decidiera abandonar o desistir del programa quedar\u00e1 igualmente obligado a abonar la totalidad del mismo.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">D\u00c9CIMA - Del pago a plazos.</span>
    <p style="${bodyText}">En el caso de acordar abonar el importe del programa establecido en diversos plazos, el cliente se compromete a pagar puntualmente los plazos establecidos que se devenguen en cada momento fruto de la presente relaci\u00f3n contractual, consider\u00e1ndose un incumplimiento contractual el retraso de cualquiera de ellos.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">D\u00c9CIMA PRIMERA - Del \u00e9xito del servicio.</span>
    <p style="${bodyText} margin-bottom: 10px;">${companyName} no se responsabiliza del \u00e9xito del programa, pues la responsabilidad del \u00e9xito dentro del programa es cometido en todos los aspectos del cliente, de su compromiso, dedicaci\u00f3n y trabajo.</p>
    <p style="${bodyText}">${companyName} ofrece los servicios indicados a lo largo de este contrato y asistencia para ayudar al usuario en el proceso, pero el \u00e9xito final es responsabilidad \u00fanica del cliente, a excepci\u00f3n de que exista incumplimiento por parte de ${companyName} o colaboradores, que incumplan con los servicios acordados.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">D\u00c9CIMA SEGUNDA - De la grabaci\u00f3n de la llamada telef\u00f3nica.</span>
    <p style="${bodyText}">Se informa al cliente que la entrevista de acceso previa que se realizar\u00e1 o se ha realizado v\u00eda telef\u00f3nica o videollamada, quedar\u00e1 grabada, por lo que, con la firma del presente contrato, el cliente muestra su total conformidad con dicha grabaci\u00f3n, renunciando a la interposici\u00f3n de cualquier acci\u00f3n contra la misma.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">D\u00c9CIMA TERCERA - De la confidencialidad.</span>
    <p style="${bodyText} margin-bottom: 10px;">Las partes acuerdan tratar confidencialmente todos aquellos datos, documentaci\u00f3n y dem\u00e1s informaci\u00f3n que haya sido suministrada durante la vigencia del presente contrato. Ambas partes se comprometen a no divulgar esta informaci\u00f3n a ninguna persona ni entidad, exceptuando sus propios empleados, a condici\u00f3n de que mantengan tambi\u00e9n la confidencialidad y solo en la medida que sea necesaria para la correcta ejecuci\u00f3n del presente contrato.</p>
    <p style="${bodyText}">En particular, ser\u00e1 considerado como Informaci\u00f3n Confidencial todo el know how o saber hacer resultante de la ejecuci\u00f3n de los servicios contratados, debiendo el adjudicatario mantener dicha informaci\u00f3n en reserva y secreto.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">D\u00c9CIMA CUARTA - De la autorizaci\u00f3n para compartir datos del cliente.</span>
    <p style="${bodyText} margin-bottom: 10px;">${companyName} puede hacer uso de los mensajes, fotos y testimonios del cliente en relaci\u00f3n con el servicio, con fines divulgativos, siempre respetando la privacidad del cliente, solamente si el cliente otorga su consentimiento expl\u00edcito para su utilizaci\u00f3n.</p>
    <p style="${bodyText} margin-bottom: 10px;">Los acuerdos de confidencialidad establecidos en la presente cl\u00e1usula tendr\u00e1n validez permanente y seguir\u00e1n en vigor tras la extinci\u00f3n o finalizaci\u00f3n de la relaci\u00f3n contractual objeto del presente.</p>
    <p style="${bodyText} margin-bottom: 8px;">Dicha cl\u00e1usula de confidencialidad no ser\u00e1 aplicable en los \u00fanicos supuestos siguientes:</p>
    <ul style="${listStyle}">
      <li style="${listItem}">Cualquier informaci\u00f3n que el cliente considere no revelable no se publicar\u00e1.</li>
      <li style="${listItem}">Cualquier informaci\u00f3n o conocimiento revelado leg\u00edtimamente por terceros.</li>
      <li style="${listItem}">Cuando la divulgaci\u00f3n sea requerida por la autoridad judicial, por ley o por alguna normativa.</li>
    </ul>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">DECIMOQUINTA - De la parte que otorga los servicios.</span>
    <p style="${bodyText}">El cliente se compromete a aceptar que el servicio por el cual est\u00e1 interesado y es objeto de este contrato pueda ser ofrecido por cualquiera de los profesionales o personas que forman o trabajan para ${companyName}.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">DECIMOSEXTA - De la protecci\u00f3n de datos.</span>
    <p style="${bodyText} margin-bottom: 10px;">En virtud de la Ley Org\u00e1nica 3/2018, de 5 de diciembre, de Protecci\u00f3n de Datos Personales y garant\u00eda de los derechos digitales, ${companyName} informa de que los datos personales del cliente quedar\u00e1n registrados en el fichero de ${companyName}, con la finalidad de llevar el pertinente Registro de Datos de sus clientes.</p>
    <p style="${bodyText} margin-bottom: 10px;">Con la firma de este contrato, el cliente da su consentimiento expl\u00edcito a que el responsable del tratamiento pueda tratar sus datos personales.</p>
    <p style="${bodyText}">Por otro lado, conforme los Art.12 a 15 LOPD, el cliente puede ejercer los derechos de acceso, cancelaci\u00f3n, rectificaci\u00f3n u oposici\u00f3n previstos en la ley.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">DECIMOSEPTIMA - Del incumplimiento.</span>
    <p style="${bodyText} margin-bottom: 10px;">Las partes acuerdan que el incumplimiento de cualquiera de las cl\u00e1usulas del presente contrato conllevar\u00e1 la resoluci\u00f3n del contrato y consecuentemente la relaci\u00f3n contractual entre las mismas, pudiendo la parte que hubiera cumplido las suyas solicitar una indemnizaci\u00f3n de da\u00f1os y perjuicios en virtud del art\u00edculo 1124 del C\u00f3digo Civil.</p>
    <p style="${bodyText} margin-bottom: 10px;">En especial, ser\u00e1 motivo de resoluci\u00f3n del presente contrato el impago de cualquiera de los pagos fijados, facultando a ${companyName} finalizar e interrumpir con la prestaci\u00f3n de los servicios.</p>
    <p style="${bodyText}">Asimismo, tambi\u00e9n ser\u00e1 motivo especial de incumplimiento y consecuente resoluci\u00f3n del contrato que el cliente ceda a terceros su usuario y/o contrase\u00f1a.</p>
  </div>

  <div style="${clauseStyle}">
    <span style="${clauseTitle}">DECIMOCTAVA - Del compromiso de las partes.</span>
    <p style="${bodyText}">Las partes aceptan el presente contrato y sus efectos jur\u00eddicos y se comprometen a su cumplimiento de buena fe.</p>
  </div>
</div>

${divider}

<!-- CIERRE Y FIRMA -->
<div style="margin-top: 40px;">
  <p style="${bodyText}">Y en prueba de conformidad con todo lo pactado y manifestado en el presente contrato, lo firman las partes, extendi\u00e9ndose por duplicado ejemplar y a un solo efecto a fecha <strong>${fechaDia} de ${fechaMes} de ${fechaAno}</strong>.</p>
</div>`;
}

export function calculateDaysFromMonths(months: number): number {
  return Math.round(months * 30.44);
}
