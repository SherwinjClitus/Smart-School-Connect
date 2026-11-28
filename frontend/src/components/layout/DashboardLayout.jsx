import { useState } from "react";
import { Box } from "@mui/material";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import FloatingAI from "../ai/FloatingAI";

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
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          bgcolor: "background.default",
          transition: "background-color 0.2s ease",
        }}
      >
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />

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

      {/* Floating AI assistant */}
      <FloatingAI />
    </Box>
  );
}

export default DashboardLayout;
