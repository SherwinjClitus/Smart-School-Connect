import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";

import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 250;

const roleLinks = {
  teacher: [
    {
      label: "Overview",
      path: "/teacher/dashboard",
      icon: DashboardOutlinedIcon,
    },
    {
      label: "Homework",
      path: "/teacher/homework",
      icon: MenuBookOutlinedIcon,
    },
    {
      label: "Announcements",
      path: "/teacher/messages",
      icon: CampaignOutlinedIcon,
    },
    {
      label: "Direct Messages",
      path: "/teacher/conversations",
      icon: ForumOutlinedIcon,
    },
  ],

  student: [
    {
      label: "Overview",
      path: "/student/dashboard",
      icon: DashboardOutlinedIcon,
    },
    {
      label: "My Homework",
      path: "/student/homework",
      icon: MenuBookOutlinedIcon,
    },
  ],

  parent: [
    {
      label: "Overview",
      path: "/parent/dashboard",
      icon: DashboardOutlinedIcon,
    },
    {
      label: "Children's Homework",
      path: "/parent/homework",
      icon: MenuBookOutlinedIcon,
    },
    {
      label: "Announcements",
      path: "/parent/messages",
      icon: CampaignOutlinedIcon,
    },
    {
      label: "Direct Messages",
      path: "/parent/conversations",
      icon: ForumOutlinedIcon,
    },
  ],
};

function Sidebar({ mobileOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isDesktop = useMediaQuery("(min-width:900px)");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const role = user?.role || "student";
  const links = roleLinks[role] || [];

  const isLinkActive = (path) => {
    if (path.includes("/conversations")) {
      return (
        location.pathname === path || location.pathname.startsWith(`${path}/`)
      );
    }

    return location.pathname === path;
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#FFFFFF",
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 3, py: 3 }}>
        <Typography
          variant="h5"
          fontWeight={800}
          color="primary"
          letterSpacing="-0.5px"
        >
          SchoolConnect
        </Typography>

        <Typography variant="caption" color="text.secondary">
          School Management Platform
        </Typography>
      </Box>

      <Divider />

      {/* Navigation */}
      <Box sx={{ px: 2, py: 2, flex: 1 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ px: 1, fontWeight: 700, letterSpacing: 1 }}
        >
          MAIN MENU
        </Typography>

        <List sx={{ mt: 1 }}>
          {links.map((link) => {
            const active = isLinkActive(link.path);
            const Icon = link.icon;

            return (
              <ListItemButton
                key={link.path}
                selected={active}
                onClick={() => {
                  navigate(link.path);
                  onClose?.();
                }}
                sx={{
                  borderRadius: 2.5,
                  mb: 0.75,
                  minHeight: 48,
                  transition: "all 0.2s ease",

                  "& .MuiListItemIcon-root": {
                    minWidth: 40,
                    color: active ? "#1976D2" : "#64748B",
                  },

                  "& .MuiListItemText-primary": {
                    fontSize: "0.95rem",
                    fontWeight: active ? 700 : 500,
                  },

                  "&.Mui-selected": {
                    bgcolor: "#EAF2FF",
                    color: "#1976D2",

                    "&:hover": {
                      bgcolor: "#DFEAFC",
                    },
                  },

                  "&:hover": {
                    bgcolor: "#F5F8FC",
                  },
                }}
              >
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>

                <ListItemText primary={link.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* User Information */}
      <Divider />

      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography variant="caption" color="text.secondary">
          SIGNED IN AS
        </Typography>

        <Typography fontWeight={700} mt={0.5}>
          {user?.name || "User"}
        </Typography>

        <Typography
          variant="caption"
          color="primary"
          sx={{ textTransform: "capitalize" }}
        >
          {role}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { md: drawerWidth },
        flexShrink: { md: 0 },
      }}
    >
      <Drawer
        variant={isDesktop ? "permanent" : "temporary"}
        open={isDesktop || mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #E5EAF1",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}

export default Sidebar;
