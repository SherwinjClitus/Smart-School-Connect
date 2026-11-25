import { useState } from "react";
import { Box } from "@mui/material";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function DashboardLayout({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />

        <Box
          component="main"
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: 1600,
            mx: "auto",
            width: "100%",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default DashboardLayout;
