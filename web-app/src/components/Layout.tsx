import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, Calculator, Calendar, UserPlus, LayoutDashboard } from 'lucide-react';

export default function Layout() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200">
                <div className="p-6 border-b border-gray-100 flex flex-col items-center">
                    <img
                        src="https://i.postimg.cc/Kj6R2R75/LOGODRA.png"
                        alt="Cuid-Arte"
                        className="h-16 w-auto object-contain"
                    />
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2 font-bold">Gestión de Leads</p>
                </div>

                <nav className="mt-6 px-4 space-y-2">
                    <Link
                        to="/dashboard"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/dashboard')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <LayoutDashboard size={20} />
                        Vista General
                    </Link>

                    <Link
                        to="/leads"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/leads')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Users size={20} />
                        Leads y Puntuación
                    </Link>

                    <Link
                        to="/agenda"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/agenda')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Calendar size={20} />
                        Agenda Hoy
                    </Link>

                    <Link
                        to="/team"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/team')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <UserPlus size={20} />
                        Gestión de Equipo
                    </Link>

                    <Link
                        to="/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/settings')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Calculator size={20} />
                        Reglas de Puntuación
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {isActive('/dashboard') ? 'Vista General' : isActive('/leads') ? 'Tablero de Control' : isActive('/agenda') ? 'Mi Agenda' : isActive('/team') ? 'Mi Equipo' : 'Configuración'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-tighter leading-none">Vendedor</p>
                            <p className="text-sm font-medium text-gray-400">Escuela Cuid-Arte</p>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
