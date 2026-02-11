import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ConnectionStatus() {
    const [isConnected, setIsConnected] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkConnection() {
            try {
                const { error } = await supabase.from('leads_escuela_cuidarte').select('count', { count: 'exact', head: true });
                setIsConnected(!error);
            } catch (e: any) {
                console.error('Connection check failed:', e);
                setIsConnected(false);
            }
        }
        checkConnection();
    }, []);

    if (isConnected === null) return null;

    return (
        <div className={`fixed bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Conectado a Supabase' : 'Error de conexión'}
        </div>
    );
}
