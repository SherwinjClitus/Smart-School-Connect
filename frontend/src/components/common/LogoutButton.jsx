
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  }

  return (
    <Button
      variant="outlined"
      color="error"
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
}

export default LogoutButton;
