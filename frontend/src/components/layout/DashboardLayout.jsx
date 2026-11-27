import { useState } from "react";
import { Box } from "@mui/material";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function DashboardLayout({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          bgcolor: "background.default",
          transition: "background-color 0.2s ease",
        }}
      >
        {/* Topbar */}
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: 1600,
            mx: "auto",
            width: "100%",
            minHeight: "calc(100vh - 70px)",
            bgcolor: "background.default",
            color: "text.primary",
            transition: "background-color 0.2s ease",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default DashboardLayout;
