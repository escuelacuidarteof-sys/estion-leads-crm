import React from 'react';
import { AlertCircle, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface ClientStatusBannerProps {
  daysRemaining: number | null;
  missedCheckins: number;
}

export const ClientStatusBanner: React.FC<ClientStatusBannerProps> = ({ daysRemaining, missedCheckins }) => {
  const isContractUrgent = daysRemaining !== null && daysRemaining < 15;
  const isContractWarning = daysRemaining !== null && daysRemaining < 30 && daysRemaining >= 15;
  const isCheckinUrgent = missedCheckins >= 3;
  const isCheckinWarning = missedCheckins >= 1 && missedCheckins < 3;

  const isUrgent = isContractUrgent || isCheckinUrgent;
  const isWarning = !isUrgent && (isContractWarning || isCheckinWarning);

  const statusMessages: string[] = [];
  if (isContractUrgent) statusMessages.push(`Contrato vence en ${daysRemaining} dias`);
  else if (isContractWarning) statusMessages.push(`${daysRemaining} dias restantes de contrato`);
  if (isCheckinUrgent) statusMessages.push(`${missedCheckins} check-ins sin enviar`);
  else if (isCheckinWarning) statusMessages.push(`${missedCheckins} check-in${missedCheckins > 1 ? 's' : ''} sin enviar`);

  const statusText = statusMessages.length > 0 ? statusMessages.join(' - ') : 'Todo en orden';

  return (
    <div
      className={`rounded-2xl p-4 border-2 flex items-center gap-4 ${
        isUrgent
          ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
          : isWarning
            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
            : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
      }`}
    >
      <div className={`p-3 rounded-xl ${isUrgent ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-emerald-100'}`}>
        {isUrgent ? (
          <AlertOctagon className="w-6 h-6 text-red-600" />
        ) : isWarning ? (
          <AlertCircle className="w-6 h-6 text-amber-600" />
        ) : (
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        )}
      </div>
      <div className="flex-1">
        <p className={`text-xs font-bold uppercase tracking-wider ${isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
          {isUrgent ? 'Requiere atencion' : isWarning ? 'Atencion' : 'Estado'}
        </p>
        <p className={`font-semibold ${isUrgent ? 'text-red-800' : isWarning ? 'text-amber-800' : 'text-emerald-800'}`}>
          {statusText}
        </p>
      </div>
    </div>
  );
};
