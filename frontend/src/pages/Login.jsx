
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button } from "@mui/material";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSignin() {
    if (!email.trim() || !pass) {
      alert("Please enter email and password!");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password: pass,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "student") {
        navigate("/student/dashboard");
      } else if (user.role === "teacher") {
        navigate("/teacher/dashboard");
      } else if (user.role === "parent") {
        navigate("/parent/dashboard");
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Invalid user role");
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 10, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Smart School Connect
      </Typography>

      <Typography variant="body1" gutterBottom>
        Welcome Back
      </Typography>

      <TextField
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Password"
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        fullWidth
        margin="normal"
      />

      <Button
        variant="contained"
        onClick={handleSignin}
        disabled={loading}
        fullWidth
        sx={{ mt: 2 }}
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </Box>
  );
}

export default Login;

