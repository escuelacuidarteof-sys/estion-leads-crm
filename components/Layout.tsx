
import React from 'react';
import { User, UserRole } from '../types';
import { checkPermission, PERMISSIONS } from '../utils/permissions';
import { normalizeRole } from '../utils/roleUtils';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Activity,
  Menu,
  X,
  Calendar,
  CalendarRange,
  CalendarClock,
  BarChart2,
  Video,
  ClipboardCheck,
  FileText,
  DollarSign,
  Plus,
  MessageCircle,
  Stethoscope,
  Bell,
  Search,
  Palette,
  Briefcase,
  ShieldCheck,
  Target,
  CreditCard,
  UserPlus,
  Award,
  MessageSquare,
  ChevronDown,
  Shield,
  Hash,
  TrendingUp,
  ShieldAlert,
  Wallet,
  Zap,
  Star,
  Apple,
  Building2,
  FolderOpen,
  CheckSquare,
  ClipboardList,
  Dumbbell,
  Calculator,
  Headphones,
  MoreHorizontal,
  HelpCircle
} from 'lucide-react';
import { StaffAnnouncements } from './StaffAnnouncements';
import { StaffOnboardingTour, hasCompletedStaffOnboarding, resetStaffOnboarding } from './StaffOnboardingTour';
import { supabase } from '../services/supabaseClient';
import { riskAlertService } from '../services/riskAlertService';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeView, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);
  const [sidebarSearch, setSidebarSearch] = React.useState('');
  const [showOnboarding, setShowOnboarding] = React.useState(() => normalizeRole(user.role) === 'coach' && !hasCompletedStaffOnboarding(user.id));
  const [pendingInvoicesCount, setPendingInvoicesCount] = React.useState(0);
  const [riskAlertsCount, setRiskAlertsCount] = React.useState(0);
  const [lastViewedRiskCount, setLastViewedRiskCount] = React.useState(0);

  // Initialize lastViewedRiskCount from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('lastViewedRiskCount');
    if (saved) setLastViewedRiskCount(parseInt(saved, 10));
  }, []);

  // Update lastViewed when entering the view
  React.useEffect(() => {
    if (activeView === 'risk-alerts') {
      const currentCount = riskAlertsCount; // Use current count
      localStorage.setItem('lastViewedRiskCount', currentCount.toString());
      setLastViewedRiskCount(currentCount);
    }
  }, [activeView, riskAlertsCount]);

  // Cargar contador de facturas pendientes (solo para admin/contabilidad)
  React.useEffect(() => {
    const loadPendingInvoices = async () => {
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.CONTABILIDAD) return;

      try {
        const { count, error } = await supabase
          .from('coach_invoices')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (!error && count !== null) {
          setPendingInvoicesCount(count);
        }
      } catch (e) {
        console.error('Error loading pending invoices count:', e);
      }
    };

    loadPendingInvoices();
    const interval = setInterval(loadPendingInvoices, 60000);
    return () => clearInterval(interval);
  }, [user.role]);

  // Cargar contador de alertas de riesgo
  React.useEffect(() => {
    const loadRiskAlerts = async () => {
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.HEAD_COACH && user.role !== UserRole.COACH) return;

      try {
        const coachId = user.role === UserRole.COACH ? user.id : undefined;
        const count = await riskAlertService.getActiveAlertsCount(coachId);
        setRiskAlertsCount(count);
      } catch (e) {
        console.error('Error loading risk alerts count:', e);
      }
    };

    loadRiskAlerts();
    const interval = setInterval(loadRiskAlerts, 60000);
    return () => clearInterval(interval);
  }, [user.role, user.id]);

  // Automatically expand sections
  React.useEffect(() => {
    // Coach has different section structure
    const coachViewToSection: Record<string, string> = {
      'dashboard': 'seguimiento', 'clients': 'seguimiento', 'coach-agenda': 'seguimiento',
      'risk-alerts': 'seguimiento', 'support-tickets': 'seguimiento',
      'reviews': 'seguimiento-coach', 'coach-tasks': 'seguimiento-coach',
      'renewals': 'seguimiento-coach', 'coach-manual': 'seguimiento-coach',
      'food-plans': 'programa', 'training-management': 'programa',
      'materials-library': 'programa', 'meditation-library': 'programa',
      'food-calculator': 'herramientas', 'nutrition-management': 'herramientas',
      'internal-protocols': 'herramientas', 'classes': 'herramientas',
      'medical-reviews': 'herramientas', 'testimonials': 'herramientas',
      'assessment-manager': 'herramientas', 'analytics': 'herramientas',
      'team-announcements': 'equipo', 'team-directory': 'equipo',
    };
    const viewToSection: Record<string, string> = isCoach ? coachViewToSection : {
      'dashboard': 'seguimiento',
      'clients': 'seguimiento',
      'reviews': 'seguimiento',
      'risk-alerts': 'seguimiento',
      'renewals': 'ventas',
      'support-tickets': 'seguimiento',
      'coach-tasks': 'seguimiento',
      'coach-manual': 'seguimiento',
      'leads': 'ventas',
      'payment-links': 'ventas',
      'new-sale': 'ventas',
      'closer-dashboard': 'ventas',
      'contracts': 'ventas',
      'food-plans': 'programa',
      'nutrition-management': 'programa',
      'training-management': 'programa',
      'food-calculator': 'programa',
      'materials-library': 'programa',
      'internal-protocols': 'programa',
      'classes': 'programa',
      'medical-reviews': 'programa',
      'doctor-dashboard': 'doctor-panel',
      'doctor-initial-reports': 'doctor-panel',
      'create-medical-report': 'doctor-panel',
      'doctor-medical-reports': 'doctor-panel',
      'doctor-invoices': 'doctor-facturas',
      'testimonials': 'programa',
      'assessment-manager': 'programa',
      'analytics': 'analisis',
      'analytics-webinars': 'analisis-negocio',
      'analytics-profile': 'analisis-negocio',
      'coach-capacity': 'analisis',
      'coach-performance': 'analisis',
      'setter-performance': 'analisis',
      'closer-performance': 'analisis',
      'staff-metrics': 'analisis',
      'accounting-dashboard': 'finanzas',
      'invoices': 'finanzas',
      'team-announcements': 'equipo',
      'team-directory': 'equipo',
      'mass-communication': 'equipo',
      'staff-management': 'administracion',
      'role-permissions': 'administracion',
      'slack-settings': 'administracion',
      'settings': 'administracion'
    };

    const section = viewToSection[activeView];
    if (section) {
      setExpandedSections(prev => {
        // Keep only the active section expanded (plus any manually opened ones will re-add via toggle)
        if (prev.length <= 1 && prev.includes(section)) return prev;
        return [section];
      });
    }

    // Special case for 'analytics' view in Direccion role
    if (activeView === 'analytics' && isDireccion) {
      setExpandedSections(prev => prev.includes('analisis-negocio') ? prev : [...prev, 'analisis-negocio']);
    }
  }, [activeView]);

  const roleLower = normalizeRole(user.role);
  const isAdmin = roleLower === 'admin';
  const isDireccion = roleLower === 'direccion';
  const isCoach = roleLower === 'coach';
  const isHeadCoach = roleLower === 'head_coach';
  const isSetter = roleLower === 'setter';
  const isCloser = roleLower === 'closer';
  const isRRSS = roleLower === 'rrss';
  const isDoctor = roleLower === 'doctor';
  const isExternalAuditor = roleLower === 'auditor_externo';

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const MenuSection = ({ title, icon: Icon, children, isOpen, onToggle, show = true }: any) => {
    if (!show) return null;
    return (
      <div className="mb-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-[2px] hover:text-white transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5" />
            {title}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className={`mt-1 space-y-1 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px] opacity-100 py-1' : 'max-h-0 opacity-0'}`}>
          {children}
        </div>
      </div>
    );
  };

  const NavItem = ({ view, icon: Icon, label, badge, dataTour }: { view: any, icon: any, label: string, badge?: number, dataTour?: string }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => {
          onNavigate(view);
          setMobileMenuOpen(false);
        }}
        {...(dataTour ? { 'data-tour': dataTour } : {})}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
          ? 'bg-brand-green text-white shadow-lg shadow-brand-green/30'
          : 'text-white/60 hover:bg-brand-dark-light hover:text-white'
          }`}
      >
        <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
        <span className="flex-1 text-left truncate">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    );
  };

  // --- All NavItems for search (flat list) ---
  const allNavItems = React.useMemo(() => {
    const items: { view: string; icon: any; label: string; badge?: number; show: boolean }[] = [
      { view: 'dashboard', icon: LayoutDashboard, label: 'Panel de Control', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'clients', icon: Users, label: 'Cartera de Clientes', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'reviews', icon: ClipboardCheck, label: 'Revisiones Semanales', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'coach-agenda', icon: CalendarClock, label: 'Agenda de Citas', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'risk-alerts', icon: ShieldAlert, label: 'Alertas Anti-Abandono', badge: Math.max(0, riskAlertsCount - lastViewedRiskCount), show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'support-tickets', icon: MessageCircle, label: 'Soporte & Tickets', show: true },
      { view: 'coach-tasks', icon: Activity, label: 'Mis Tareas', show: true },
      { view: 'coach-manual', icon: ClipboardList, label: 'Manual Interno Coach', show: (isCoach || isAdmin) },
      { view: 'renewals', icon: CalendarRange, label: 'Gestión Renovaciones', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'leads', icon: Briefcase, label: 'Leads / Pre-Venta', show: (isCloser || isSetter || isAdmin || isHeadCoach) },
      { view: 'food-plans', icon: FileText, label: 'Planes Alimentación', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'nutrition-management', icon: Apple, label: 'Planes Nutricionales', show: checkPermission(user, PERMISSIONS.ACCESS_NUTRITION) },
      { view: 'food-calculator', icon: Calculator, label: 'Calculadora Alimentos', show: (isCoach || isAdmin) },
      { view: 'training-management', icon: Dumbbell, label: 'Entrenamientos', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'materials-library', icon: FolderOpen, label: 'Biblioteca Materiales', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'meditation-library', icon: Headphones, label: 'Biblioteca Meditación', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'internal-protocols', icon: FileText, label: 'Protocolos Internos', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'events', icon: Calendar, label: 'Eventos / Agenda', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'classes', icon: Video, label: 'Clases Semanales', show: (isCoach || isHeadCoach || isAdmin) },
      { view: 'medical-reviews', icon: MessageCircle, label: 'Preguntas Dra Odile', show: checkPermission(user, PERMISSIONS.VIEW_MEDICAL) },
      { view: 'testimonials', icon: Star, label: 'Testimonios', show: !isCloser && !isSetter },
      { view: 'analytics', icon: BarChart2, label: 'Estadísticas App', show: !isCloser && !isRRSS },
      { view: 'team-announcements', icon: Bell, label: 'Tablón Anuncios', show: true },
      { view: 'team-directory', icon: Users, label: 'Directorio Equipo', show: true },
    ];
    return items.filter(i => i.show);
  }, [user, isCoach, isHeadCoach, isAdmin, isCloser, isSetter, isRRSS, riskAlertsCount, lastViewedRiskCount]);

  // --- Search filter rendering ---
  const renderSearchResults = () => {
    const q = sidebarSearch.toLowerCase().trim();
    if (!q) return null;
    const matches = allNavItems.filter(i => i.label.toLowerCase().includes(q));
    if (matches.length === 0) {
      return <p className="px-4 py-3 text-xs text-slate-500 italic">Sin resultados</p>;
    }
    return (
      <div className="space-y-1">
        {matches.map(item => (
          <NavItem key={item.view} view={item.view} icon={item.icon} label={item.label} badge={item.badge} />
        ))}
      </div>
    );
  };

  // --- Sidebar search input ---
  const renderSearchInput = () => (
    <div className="px-4 pb-3 pt-1" data-tour="sidebar-search">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={sidebarSearch}
          onChange={(e) => setSidebarSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/20 transition-all"
        />
        {sidebarSearch && (
          <button onClick={() => setSidebarSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  // --- Coach-specific sidebar ---
  const renderCoachSidebar = () => {
    if (sidebarSearch.trim()) return renderSearchResults();
    return (
      <>
        {/* Mi Panel - lo más importante */}
        <MenuSection
          title="Mi Panel"
          icon={LayoutDashboard}
          isOpen={expandedSections.includes('seguimiento')}
          onToggle={() => toggleSection('seguimiento')}
        >
          <NavItem view="dashboard" icon={LayoutDashboard} label="Panel de Control" />
          <NavItem view="clients" icon={Users} label="Cartera de Clientes" dataTour="nav-clients" />
          <NavItem view="coach-agenda" icon={CalendarClock} label="Agenda de Citas" />
          <NavItem
            view="risk-alerts"
            icon={ShieldAlert}
            label="Alertas"
            badge={Math.max(0, riskAlertsCount - lastViewedRiskCount)}
            dataTour="nav-alerts"
          />
          <NavItem view="support-tickets" icon={MessageCircle} label="Soporte & Tickets" />
        </MenuSection>

        {/* Seguimiento */}
        <MenuSection
          title="Seguimiento"
          icon={ClipboardCheck}
          isOpen={expandedSections.includes('seguimiento-coach')}
          onToggle={() => toggleSection('seguimiento-coach')}
        >
          <NavItem view="reviews" icon={ClipboardCheck} label="Revisiones Semanales" />
          <NavItem view="coach-tasks" icon={Activity} label="Mis Tareas" />
          <NavItem view="renewals" icon={CalendarRange} label="Renovaciones" />
          <NavItem view="coach-manual" icon={ClipboardList} label="Manual Coach" dataTour="nav-manual" />
        </MenuSection>

        {/* Programa */}
        <MenuSection
          title="Programa"
          icon={Dumbbell}
          isOpen={expandedSections.includes('programa')}
          onToggle={() => toggleSection('programa')}
        >
          <NavItem view="food-plans" icon={FileText} label="Planes Alimentación" />
          <NavItem view="training-management" icon={Dumbbell} label="Entrenamientos" />
          <NavItem view="materials-library" icon={FolderOpen} label="Materiales" />
          <NavItem view="meditation-library" icon={Headphones} label="Meditación" />
        </MenuSection>

        {/* Más herramientas - colapsado por defecto */}
        <MenuSection
          title="Más herramientas"
          icon={MoreHorizontal}
          isOpen={expandedSections.includes('herramientas')}
          onToggle={() => toggleSection('herramientas')}
        >
          <NavItem view="food-calculator" icon={Calculator} label="Calculadora Alimentos" />
          {checkPermission(user, PERMISSIONS.ACCESS_NUTRITION) && (
            <NavItem view="nutrition-management" icon={Apple} label="Planes Nutricionales" />
          )}
          <NavItem view="internal-protocols" icon={FileText} label="Protocolos Internos" />
          <NavItem view="classes" icon={Video} label="Clases Semanales" />
          <NavItem view="events" icon={Calendar} label="Eventos / Agenda" />
          {checkPermission(user, PERMISSIONS.VIEW_MEDICAL) && (
            <NavItem view="medical-reviews" icon={MessageCircle} label="Preguntas Dra Odile" />
          )}
          <NavItem view="testimonials" icon={Star} label="Testimonios" />
          {checkPermission(user, PERMISSIONS.MANAGE_SETTINGS) && (
            <NavItem view="assessment-manager" icon={Settings} label="Config. Valoración" />
          )}
          <NavItem view="analytics" icon={BarChart2} label="Estadísticas" />
        </MenuSection>

        {/* Equipo */}
        <MenuSection
          title="Equipo"
          icon={MessageSquare}
          isOpen={expandedSections.includes('equipo')}
          onToggle={() => toggleSection('equipo')}
        >
          <NavItem view="team-announcements" icon={Bell} label="Tablón Anuncios" />
          <NavItem view="team-directory" icon={Users} label="Directorio" />
        </MenuSection>
      </>
    );
  };

  // --- Generic sidebar for admin/head_coach/setter/closer/rrss ---
  const renderGenericSidebar = () => {
    if (sidebarSearch.trim()) return renderSearchResults();
    return (
      <>
        {/* 1. SEGUIMIENTO */}
        <MenuSection
          title="Seguimiento de Clientes"
          icon={Zap}
          isOpen={expandedSections.includes('seguimiento')}
          onToggle={() => toggleSection('seguimiento')}
          show={true}
        >
          {((checkPermission(user, PERMISSIONS.VIEW_CLIENTS) || isCoach) &&
            !isCloser &&
            !isRRSS &&
            !isSetter) && (
              <>
                <NavItem view="dashboard" icon={LayoutDashboard} label="Panel de Control" />
                <NavItem view="clients" icon={Users} label="Cartera de Clientes" />
                <NavItem view="reviews" icon={ClipboardCheck} label="Revisiones Semanales" />
                <NavItem view="coach-agenda" icon={CalendarClock} label="Agenda de Citas" />
                <NavItem
                  view="risk-alerts"
                  icon={ShieldAlert}
                  label="Alertas Anti-Abandono"
                  badge={Math.max(0, riskAlertsCount - lastViewedRiskCount)}
                />
              </>
            )}
          <NavItem view="support-tickets" icon={MessageCircle} label="Soporte & Tickets" />
          <NavItem view="coach-tasks" icon={Activity} label="Mis Tareas" />
          {(isCoach || isAdmin) && (
            <NavItem view="coach-manual" icon={ClipboardList} label="Manual Interno Coach" />
          )}
        </MenuSection>

        {/* 2. VENTAS */}
        <MenuSection
          title="Ventas & Altas"
          icon={DollarSign}
          isOpen={expandedSections.includes('ventas')}
          onToggle={() => toggleSection('ventas')}
          show={checkPermission(user, PERMISSIONS.VIEW_SALES) || isCloser || isAdmin || isHeadCoach || isCoach}
        >
          {(isCloser || isSetter || isAdmin || isHeadCoach) && (
            <NavItem view="leads" icon={Briefcase} label="Leads / Pre-Venta" />
          )}
          {(checkPermission(user, PERMISSIONS.VIEW_RENEWALS) || isCoach || isHeadCoach) && (
            <NavItem view="renewals" icon={CalendarRange} label="Gestión Renovaciones" />
          )}
          {(isCloser || isAdmin || isHeadCoach) && (
            <>
              <NavItem view="payment-links" icon={CreditCard} label="Enlaces de Pago" />
              <NavItem view="new-sale" icon={UserPlus} label="Nueva Alta" />
              <NavItem view="closer-dashboard" icon={Target} label="Panel de Closer" />
              <NavItem view="contracts" icon={FileText} label="Gestión Contratos" />
            </>
          )}
        </MenuSection>

        {/* 3. PROGRAMA */}
        <MenuSection
          title="Programa & Contenido"
          icon={ClipboardCheck}
          isOpen={expandedSections.includes('programa')}
          onToggle={() => toggleSection('programa')}
          show={!isCloser && !isSetter}
        >
          {!isRRSS && (
            <>
              <NavItem view="food-plans" icon={FileText} label="Planes Alimentación" />
              {checkPermission(user, PERMISSIONS.ACCESS_NUTRITION) && (
                <NavItem view="nutrition-management" icon={Apple} label="Planes Nutricionales" />
              )}
              {(isCoach || isAdmin) && (
                <NavItem view="food-calculator" icon={Calculator} label="Calculadora Alimentos" />
              )}
              <NavItem view="training-management" icon={Dumbbell} label="Entrenamientos" />
              <NavItem view="materials-library" icon={FolderOpen} label="Biblioteca Materiales" />
              <NavItem view="meditation-library" icon={Headphones} label="Biblioteca Meditación" />
              <NavItem view="internal-protocols" icon={FileText} label="Protocolos Internos" />
              <NavItem view="classes" icon={Video} label="Clases Semanales" />
              <NavItem view="events" icon={Calendar} label="Eventos / Agenda" />
            </>
          )}
          {checkPermission(user, PERMISSIONS.VIEW_MEDICAL) && (
            <NavItem view="medical-reviews" icon={MessageCircle} label="Preguntas Dra Odile" />
          )}
          <NavItem view="testimonials" icon={Star} label="Testimonios" />
          {(checkPermission(user, PERMISSIONS.MANAGE_SETTINGS) && !isRRSS) && (
            <NavItem view="assessment-manager" icon={Settings} label="Config. Valoración" />
          )}
        </MenuSection>

        {/* 4. ANÁLISIS */}
        <MenuSection
          title="Análisis & Rendimiento"
          icon={TrendingUp}
          isOpen={expandedSections.includes('analisis')}
          onToggle={() => toggleSection('analisis')}
          show={!isCloser && !isRRSS}
        >
          <NavItem view="analytics" icon={BarChart2} label="Estadísticas App" />
          {isSetter && (
            <NavItem view="setter-performance" icon={TrendingUp} label="Mi Rendimiento Setter" />
          )}
          {checkPermission(user, PERMISSIONS.MANAGE_SETTINGS) && (
            <>
              <NavItem view="coach-capacity" icon={Activity} label="Gestión Capacidad" />
              <NavItem view="coach-performance" icon={Award} label="Rendimiento Coaches" />
              <NavItem view="setter-performance" icon={Search} label="Rendimiento Setters" />
              <NavItem view="closer-performance" icon={Target} label="Rendimiento Closers" />
              <NavItem view="staff-metrics" icon={TrendingUp} label="Sales Intelligence" />
            </>
          )}
        </MenuSection>

        {/* 5. FINANZAS */}
        <MenuSection
          title="Economía"
          icon={Wallet}
          isOpen={expandedSections.includes('finanzas')}
          onToggle={() => toggleSection('finanzas')}
          show={checkPermission(user, PERMISSIONS.VIEW_FINANCE) || roleLower === 'contabilidad' || isAdmin}
        >
          <NavItem view="accounting-dashboard" icon={Briefcase} label="Libro Contable" />
          <NavItem view="invoices" icon={DollarSign} label="Pagos & Facturas" badge={pendingInvoicesCount} />
        </MenuSection>

        {/* 6. EQUIPO */}
        <MenuSection
          title="Equipo & Comunicación"
          icon={MessageSquare}
          isOpen={expandedSections.includes('equipo')}
          onToggle={() => toggleSection('equipo')}
        >
          <NavItem view="team-announcements" icon={Bell} label="Tablón Anuncios" />
          <NavItem view="team-directory" icon={Users} label="Directorio Equipo" />
          {checkPermission(user, PERMISSIONS.MANAGE_SETTINGS) && (
            <NavItem view="mass-communication" icon={MessageSquare} label="Comunicación Masiva" />
          )}
        </MenuSection>

        {/* 7. ADMIN */}
        <MenuSection
          title="Configuración Ado"
          icon={ShieldCheck}
          isOpen={expandedSections.includes('administracion')}
          onToggle={() => toggleSection('administracion')}
          show={isAdmin}
        >
          <NavItem view="staff-management" icon={Users} label="Gestión de Personal" />
          <NavItem view="role-permissions" icon={Shield} label="Permisos por Rol" />
          <NavItem view="slack-settings" icon={Hash} label="Integración Slack" />
          <NavItem view="settings" icon={Settings} label="Ajustes Técnicos" />
        </MenuSection>
      </>
    );
  };

  // --- Role-specific sidebar content dispatcher ---
  const renderSidebarContent = () => {
    if (isExternalAuditor) {
      return (
        <MenuSection title="Auditoría" icon={Shield} isOpen={expandedSections.includes('auditoria')} onToggle={() => toggleSection('auditoria')} show={true}>
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="clients" icon={Users} label="Cartera de Clientes" />
        </MenuSection>
      );
    }
    if (isDireccion) {
      return (
        <>
          <MenuSection title="CRM Principal" icon={Building2} isOpen={expandedSections.includes('crm-principal')} onToggle={() => toggleSection('crm-principal')} show={true}>
            <NavItem view="analytics-ado" icon={TrendingUp} label="Métricas de Negocio" />
            <NavItem view="staff-metrics" icon={BarChart2} label="Dashboard Operativo" />
            <NavItem view="clients" icon={Users} label="Cartera de Clientes" />
            <NavItem view="renewals" icon={CalendarRange} label="Renovaciones" />
            <NavItem view="leads" icon={Briefcase} label="Leads / Pre-Venta" />
            <NavItem view="new-sale" icon={UserPlus} label="Nueva Alta" />
            <NavItem view="closer-performance" icon={Target} label="Rendimiento Closers" />
            <NavItem view="coach-performance" icon={Award} label="Rendimiento Coaches" />
            <NavItem view="setter-performance" icon={Search} label="Rendimiento Setters" />
          </MenuSection>
          <MenuSection title="CRM ME" icon={Stethoscope} isOpen={expandedSections.includes('crm-me')} onToggle={() => toggleSection('crm-me')} show={true}>
            <NavItem view="analytics-me" icon={TrendingUp} label="Métricas de Negocio ME" />
            <NavItem view="me-dashboard" icon={BarChart2} label="Dashboard ME" />
            <NavItem view="me-clients" icon={Users} label="Cartera Clientes ME" />
            <NavItem view="me-closer-performance" icon={Target} label="Rendimiento Closers ME" />
            <NavItem view="me-setter-performance" icon={Search} label="Rendimiento Setters ME" />
          </MenuSection>
          <MenuSection title="Economía" icon={Wallet} isOpen={expandedSections.includes('finanzas')} onToggle={() => toggleSection('finanzas')} show={true}>
            <NavItem view="invoices" icon={DollarSign} label="Pagos & Facturas" />
          </MenuSection>
        </>
      );
    }
    if (isDoctor) {
      return (
        <>
          <MenuSection title="Mi Panel" icon={Stethoscope} isOpen={expandedSections.includes('doctor-panel')} onToggle={() => toggleSection('doctor-panel')} show={true}>
            <NavItem view="doctor-dashboard" icon={LayoutDashboard} label="Mi Dashboard" />
            <NavItem view="doctor-initial-reports" icon={ClipboardList} label="Informes Iniciales" />
            <NavItem view="medical-reviews" icon={ClipboardCheck} label="Consultas Alumnos" />
            <NavItem view="create-medical-report" icon={FileText} label="Crear Informe" />
            <NavItem view="doctor-medical-reports" icon={FileText} label="Mis Informes" />
            <NavItem view="coach-agenda" icon={CalendarClock} label="Mi Agenda" />
            <NavItem view="coach-tasks" icon={CheckSquare} label="Mis Tareas y Notas" />
          </MenuSection>
          <MenuSection title="Facturación" icon={Wallet} isOpen={expandedSections.includes('doctor-facturas')} onToggle={() => toggleSection('doctor-facturas')} show={true}>
            <NavItem view="doctor-invoices" icon={DollarSign} label="Mis Facturas" />
          </MenuSection>
          <MenuSection title="Comunicación" icon={MessageSquare} isOpen={expandedSections.includes('doctor-comunica')} onToggle={() => toggleSection('doctor-comunica')} show={true}>
            <NavItem view="team-announcements" icon={Bell} label="Tablón Anuncios" />
            <NavItem view="team-directory" icon={Users} label="Directorio Equipo" />
          </MenuSection>
        </>
      );
    }
    if (isCoach) return renderCoachSidebar();
    return renderGenericSidebar();
  };

  const isClient = user.role === UserRole.CLIENT;

  if (isClient) {
    return (
      <div className="min-h-screen bg-[#f8faf8] font-sans">
        <div className="bg-brand-dark text-white px-4 py-4 flex justify-between items-center shadow-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="font-bold text-lg leading-none">Cuid-Arte CRM</h1>
              <p className="text-[10px] text-slate-400 font-medium">Portal del Alumno</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
        <main className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-row font-sans">
      {/* Header móvil con hamburguesa */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-brand-dark text-white px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <h1 className="font-bold text-base leading-none">Cuid-Arte CRM</h1>
            <p className="text-[10px] text-slate-400">Salud y Bienestar</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay para cerrar menú móvil */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Menú lateral móvil */}
      <aside className={`md:hidden fixed top-14 left-0 bottom-0 w-72 bg-brand-dark z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="px-4 py-4 space-y-1">
          {renderSearchInput()}
          {renderSidebarContent()}
        </nav>

        {/* Perfil usuario móvil */}
        <div className="p-4 border-t border-slate-800 bg-[#0B1120]">
          <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${activeView === 'profile' ? 'bg-slate-800' : 'hover:bg-slate-800'}`} onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }}>
            <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-slate-700" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors">
            <LogOut className="w-3 h-3" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Sidebar desktop (sin cambios) */}
      <aside className="hidden md:flex print:hidden w-72 bg-brand-dark flex-col fixed h-full z-20 shadow-xl border-r border-brand-dark-light">
        <div onClick={() => onNavigate('dashboard')} className="p-8 pb-4 flex items-center gap-3 cursor-pointer group/logo transition-all hover:opacity-80">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brand-green/20 group-hover/logo:scale-110 transition-transform duration-300" />
          <div>
            <h1 className="font-heading font-bold text-white text-lg tracking-tight leading-none group-hover/logo:text-brand-mint transition-colors">Cuid-Arte CRM</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">Salud y Bienestar</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {renderSearchInput()}
          {renderSidebarContent()}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-[#0B1120]">
          <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${activeView === 'profile' ? 'bg-slate-800' : 'hover:bg-slate-800'}`} onClick={() => onNavigate('profile')}>
            <div className="relative">
              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-slate-700" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0B1120] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
            </div>
          </div>
          {isCoach && (
            <button
              onClick={() => { resetStaffOnboarding(user.id); setShowOnboarding(true); }}
              className="mt-1 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <HelpCircle className="w-3 h-3" /> Repetir tutorial
            </button>
          )}
          <button onClick={onLogout} className="mt-1 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors">
            <LogOut className="w-3 h-3" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Staff Onboarding Tour */}
      {showOnboarding && (
        <StaffOnboardingTour userId={user.id} onComplete={() => setShowOnboarding(false)} />
      )}

      <main className="flex-1 md:ml-72 print:ml-0 relative min-h-screen">
        <div className="hidden md:flex sticky top-0 bg-[#f8faf8]/80 backdrop-blur-md z-[999] px-8 py-4 justify-end items-center gap-4">
          <StaffAnnouncements user={user} onNavigate={onNavigate} />
        </div>
        <div className="relative z-0 p-4 md:p-8 pt-16 md:pt-4">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
