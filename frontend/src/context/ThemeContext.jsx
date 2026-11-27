import { createContext, useContext, useMemo, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem("schoolconnect-theme") || "light";
  });

  const toggleTheme = () => {
    setMode((currentMode) => {
      const newMode = currentMode === "light" ? "dark" : "light";

      localStorage.setItem("schoolconnect-theme", newMode);

      return newMode;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "light" ? "#1769C2" : "#60A5FA",
          },
          background: {
            default: mode === "light" ? "#F8FAFC" : "#111827",
            paper: mode === "light" ? "#FFFFFF" : "#1F2937",
          },
          text: {
            primary: mode === "light" ? "#172B4D" : "#F1F5F9",
            secondary: mode === "light" ? "#64748B" : "#AAB6C7",
          },
          divider: mode === "light" ? "#E5EAF1" : "#374151",
        },
        shape: {
          borderRadius: 10,
        },
        typography: {
          fontFamily: '"Roboto", "Arial", sans-serif',
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }

  return context;
}
