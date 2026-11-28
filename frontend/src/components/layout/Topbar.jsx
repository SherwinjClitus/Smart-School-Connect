import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Stack,
  Divider,
  Tooltip,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import Brightness4OutlinedIcon from "@mui/icons-material/Brightness4Outlined";
import Brightness7OutlinedIcon from "@mui/icons-material/Brightness7Outlined";

import LogoutButton from "../common/LogoutButton";
import { useAppTheme } from "../../context/useAppTheme";

function Topbar({ onMenuClick, title }) {
  const { mode, toggleTheme } = useAppTheme();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const role = user?.role || "user";

  const roleColors = {
    teacher: "#7C3AED",
    student: "#0284C7",
    parent: "#059669",
  };

  const avatarColor = roleColors[role] || "#1976D2";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        backgroundImage: "none",
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 64, sm: 70 },
          px: { xs: 2, sm: 3, md: 4 },
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* Left Section */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <IconButton
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            sx={{
              display: { xs: "inline-flex", md: "none" },
              color: "text.secondary",
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              color="text.primary"
              noWrap
              sx={{
                fontSize: { xs: "1.05rem", sm: "1.2rem" },
                letterSpacing: "-0.4px",
              }}
            >
              {title || "Overview"}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: { xs: "none", sm: "block" },
                mt: 0.2,
              }}
            >
              Welcome to Smart School Connect
            </Typography>
          </Box>
        </Stack>

        {/* Right Section */}
        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 2 }}
          sx={{ alignItems: "center" }}
        >
          {/* Dark / Light Mode Toggle */}
          <Tooltip
            title={
              mode === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
          >
            <IconButton
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              sx={{
                color: "text.secondary",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                width: 38,
                height: 38,
                "&:hover": {
                  bgcolor: "action.hover",
                },
                "& svg": {
                  transition: "transform 300ms ease",
                },
                "&:active svg": {
                  transform: "rotate(25deg)",
                },
              }}
            >
              {mode === "light" ? (
                <Brightness4OutlinedIcon />
              ) : (
                <Brightness7OutlinedIcon />
              )}
            </IconButton>
          </Tooltip>

          {/* User Information */}
          <Stack direction="row" spacing={1.2} sx={{ alignItems: "center" }}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: avatarColor,
                fontSize: 14,
                fontWeight: 700,
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              {initials}
            </Avatar>

            <Box
              sx={{
                display: { xs: "none", sm: "block" },
                minWidth: 0,
              }}
            >
              <Typography
                variant="body2"
                fontWeight={700}
                color="text.primary"
                noWrap
              >
                {user?.name || "User"}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: avatarColor,
                  textTransform: "capitalize",
                  fontWeight: 600,
                }}
              >
                {role}
              </Typography>
            </Box>
          </Stack>

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              display: { xs: "none", sm: "block" },
              borderColor: "divider",
              mx: 0.5,
            }}
          />

          <LogoutButton />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default Topbar;
