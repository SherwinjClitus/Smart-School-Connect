import { Button } from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const navigate = useNavigate();

  function handleLogout() {
    // Remove auth-scoped keys. If your app persists non-auth preferences
    // (e.g. theme mode) in localStorage, keep those and delete the rest
    // explicitly instead of calling localStorage.clear().
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("selectedChild");

    navigate("/login", { replace: true });
  }

  return (
    <Button
      variant="outlined"
      color="error"
      startIcon={<LogoutRoundedIcon />}
      onClick={handleLogout}
      sx={{
        textTransform: "none",
        fontWeight: 700,
        minHeight: 38,
      }}
    >
      Logout
    </Button>
  );
}

export default LogoutButton;
