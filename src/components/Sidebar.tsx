import {
  LayoutDashboard,
  PenSquare,
  Rss,
  BarChart3,
  Calendar,
  History,
  Settings,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  scheduledCount: number;
  isMonitoring: boolean;
  onMonitor: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  pendingCount,
  scheduledCount,
  isMonitoring,
  onMonitor
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Approval Queue', icon: LayoutDashboard, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'publisher', name: 'Manual Composer', icon: PenSquare },
    { id: 'sources', name: 'Feed Sources', icon: Rss },
    { id: 'calendar', name: 'Content Calendar', icon: Calendar, badge: scheduledCount > 0 ? scheduledCount : null },
    { id: 'history', name: 'Post History', icon: History },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'settings', name: 'X Integration', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between h-full">
      <div className="flex flex-col flex-1 p-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800 mb-6">
          <div className="bg-sky-500 text-white p-2 rounded-lg shadow-lg shadow-sky-500/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight tracking-tight">X Content</h1>
            <span className="text-xs text-slate-500 font-mono">AI Studio v1.0</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-600/15 text-sky-400 border-l-2 border-sky-500 pl-2.5'
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-4.5 h-4.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    item.id === 'dashboard' ? 'bg-sky-500/15 text-sky-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Monitor trigger action in sidebar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={onMonitor}
          disabled={isMonitoring}
          className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/10 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isMonitoring ? 'animate-spin' : ''}`} />
          <span>{isMonitoring ? 'Checking Feeds...' : 'Sync & Check Feeds'}</span>
        </button>
      </div>
    </aside>
  );
}
