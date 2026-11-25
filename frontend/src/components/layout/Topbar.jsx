import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";

import LogoutButton from "../common/LogoutButton";

function Topbar({ onMenuClick, title }) {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{
        borderBottom: "1px solid #e5e7eb",
        bgcolor: "#fff",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={onMenuClick} sx={{ display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" fontWeight={700}>
            {title || "Overview"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" fontWeight={600}>
              {user?.name || "User"}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {user?.role || ""}
            </Typography>
          </Box>

          <Avatar sx={{ bgcolor: "primary.main" }}>{initials}</Avatar>

          <LogoutButton />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Topbar;
