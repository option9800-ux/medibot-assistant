import {
  Activity,
  MessageSquare,
  ClipboardList,
  Pill,
  FileText,
  MapPin,
  History,
  UserCircle,
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
  { title: "Chat Assistant", url: "/chat?mode=medical", icon: MessageSquare },
  { title: "Symptom Checker", url: "/symptoms", icon: ClipboardList },
  { title: "Medicine Info", url: "/medicine", icon: Pill },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Doctor Finder", url: "/doctors", icon: MapPin },
  { title: "Health History", url: "/history", icon: History },
  { title: "My Profile", url: "/profile", icon: UserCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (url: string) => {
    if (url.includes("?")) return location.pathname + location.search === url;
    return location.pathname === url;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="font-bold text-primary text-lg glow-text">MediAssist AI</span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
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
      </SidebarContent>

      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground leading-tight">
            ⚕️ This AI provides general health info. Not a substitute for professional medical advice.
          </p>
        </div>
      )}
    </Sidebar>
  );
}
