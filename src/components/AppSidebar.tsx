import {
  Activity,
  MessageSquare,
  ClipboardList,
  Pill,
  FileText,
  MapPin,
  History,
  UserCircle,
  LayoutDashboard,
  Calendar,
  HeartPulse,
  AlertTriangle,
  PillBottle,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "AI Chat", url: "/chat?mode=medical", icon: MessageSquare },
  { title: "Symptom Checker", url: "/symptoms", icon: ClipboardList },
  { title: "Medicine Info", url: "/medicine", icon: Pill },
  { title: "Reports", url: "/reports", icon: FileText },
];

const careItems = [
  { title: "Medications", url: "/medications", icon: PillBottle },
  { title: "Vitals", url: "/vitals", icon: HeartPulse },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Emergency SOS", url: "/emergency", icon: AlertTriangle },
];

const toolsItems = [
  { title: "Doctor Finder", url: "/doctors", icon: MapPin },
  { title: "Health History", url: "/history", icon: History },
  { title: "My Profile", url: "/profile", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    if (url.includes("?")) return location.pathname + location.search === url;
    return location.pathname === url;
  };

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end
                  className="hover:bg-sidebar-accent/50 rounded-lg transition-all"
                  activeClassName="bg-primary/10 text-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Activity className="w-4.5 h-4.5 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-primary text-base tracking-tight">MediAssist</span>
              <span className="text-xs text-muted-foreground ml-1.5">AI</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        {renderGroup("Main", mainItems)}
        {renderGroup("Care", careItems)}
        {renderGroup("Tools", toolsItems)}
      </SidebarContent>

      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground/60 leading-tight text-center">
            ⚕️ General health info only. Not medical advice.
          </p>
        </div>
      )}
    </Sidebar>
  );
}
