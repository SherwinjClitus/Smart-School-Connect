import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
} from "@mui/material";

import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 250;

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

  const roleLinks = {
    teacher: [
      { label: "Overview", path: "/teacher/dashboard" },
      { label: "Homework", path: "/teacher/homework" },
      { label: "Messages", path: "/teacher/messages" },
    ],
    student: [
      { label: "Overview", path: "/student/dashboard" },
      { label: "My Homework", path: "/student/homework" },
    ],
    parent: [
      { label: "Overview", path: "/parent/dashboard" },
      { label: "Children's Homework", path: "/parent/homework" },
      { label: "Messages", path: "/parent/messages" },
      { label: "Direct Messages", path: "/parent/conversations" },
    ],
  };

  const links = roleLinks[role] || [];

  const drawerContent = (
    <Box sx={{ height: "100%", bgcolor: "#fff" }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="h5" fontWeight={800} color="primary">
          SchoolConnect
        </Typography>

        <Typography variant="caption" color="text.secondary">
          School Management Platform
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ px: 1 }}>
          MAIN MENU
        </Typography>

        <List sx={{ mt: 1 }}>
          {links.map((link) => {
            const active = location.pathname === link.path;

            return (
              <ListItemButton
                key={link.path}
                selected={active}
                onClick={() => {
                  navigate(link.path);
                  onClose?.();
                }}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "#e8f0fe",
                    color: "#1976d2",
                    "&:hover": {
                      bgcolor: "#dce8fc",
                    },
                  },
                }}
              >
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{
                    fontWeight: active ? 700 : 500,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Divider />

      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Signed in as
        </Typography>

        <Typography fontWeight={600}>{user?.name || "User"}</Typography>

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
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
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
            borderRight: "1px solid #e5e7eb",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}

export default Sidebar;
