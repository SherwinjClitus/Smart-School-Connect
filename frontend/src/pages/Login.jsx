import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";

import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSignin(e) {
    e.preventDefault();

    if (!email.trim() || !pass) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password: pass,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid login response.");
      }

      if (!["student", "teacher", "parent"].includes(user.role)) {
        setError("Invalid user role.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else if (user.role === "teacher") {
        navigate("/teacher/dashboard", { replace: true });
      } else {
        navigate("/parent/dashboard", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#F3F6FC",
      }}
    >
      {/* Left Branding Section */}
      <Box
        sx={{
          width: { xs: "0%", md: "50%" },
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: { md: 6, lg: 9 },
          color: "#FFFFFF",
          background:
            "linear-gradient(145deg, #102A56 0%, #164B91 55%, #2876C7 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative Circle */}
        <Box
          sx={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.12)",
            right: -170,
            top: -130,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.045)",
            left: -130,
            bottom: -100,
          }}
        />

        {/* Branding */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2.5,
              bgcolor: "rgba(255,255,255,0.15)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <SchoolRoundedIcon sx={{ fontSize: 30 }} />
          </Box>

          <Typography fontSize={23} fontWeight={800}>
            SchoolConnect
          </Typography>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            maxWidth: 520,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: "#B9D9FF",
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            CONNECTING EDUCATION
          </Typography>

          <Typography
            sx={{
              fontSize: { md: 38, lg: 48 },
              fontWeight: 800,
              lineHeight: 1.2,
              mt: 2,
              mb: 2.5,
            }}
          >
            Bringing schools,
            <br />
            parents and students
            <br />
            closer together.
          </Typography>

          <Typography
            sx={{
              color: "#D6E6FA",
              fontSize: 16,
              lineHeight: 1.8,
              maxWidth: 440,
            }}
          >
            One connected platform for classroom updates, homework,
            announcements and meaningful communication.
          </Typography>

          <Box
            sx={{
              mt: 5,
              display: "flex",
              gap: 2,
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 3,
                bgcolor: "#8CC7FF",
                borderRadius: 5,
              }}
            />

            <Typography variant="body2" color="#D6E6FA">
              A smarter way to stay connected.
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: "#B9D9FF",
            position: "relative",
            zIndex: 1,
          }}
        >
          © 2026 Smart School Connect
        </Typography>
      </Box>

      {/* Right Login Section */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2.5, sm: 4 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 430 }}>
          {/* Mobile Branding */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1.5,
              mb: 5,
            }}
          >
            <SchoolRoundedIcon sx={{ fontSize: 35, color: "#1976D2" }} />

            <Typography fontSize={22} fontWeight={800} color="#163B70">
              SchoolConnect
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4.5 },
              borderRadius: 4,
              border: "1px solid #E5EAF2",
              boxShadow: "0 16px 50px rgba(28, 57, 99, 0.07)",
              bgcolor: "#FFFFFF",
            }}
          >
            {/* Heading */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                fontWeight={800}
                color="#172B4D"
                sx={{ letterSpacing: "-1px" }}
              >
                Welcome back!
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Sign in to continue to your account.
              </Typography>
            </Box>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSignin}>
              {/* Email */}
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#344563",
                  mb: 1,
                }}
              >
                Email address
              </Typography>

              <TextField
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                fullWidth
                autoComplete="email"
                disabled={loading}
                sx={{
                  mb: 2.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    bgcolor: "#FAFBFD",
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon sx={{ color: "#8493A8" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Password Label */}
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#344563",
                  mb: 1,
                }}
              >
                Password
              </Typography>

              {/* Password */}
              <TextField
                type={showPassword ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Enter your password"
                fullWidth
                autoComplete="current-password"
                disabled={loading}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    bgcolor: "#FAFBFD",
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: "#8493A8" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon />
                          ) : (
                            <VisibilityOutlinedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Sign In Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  fontSize: 15,
                  fontWeight: 700,
                  textTransform: "none",
                  bgcolor: "#1769C2",
                  boxShadow: "0 6px 16px rgba(23, 105, 194, 0.2)",
                  "&:hover": {
                    bgcolor: "#1255A0",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={23} color="inherit" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Footer */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                textAlign: "center",
                display: "block",
              }}
            >
              Secure access for students, teachers and parents.
            </Typography>
          </Paper>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 3,
            }}
          >
            Smart School Connect · School Management Platform
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;
