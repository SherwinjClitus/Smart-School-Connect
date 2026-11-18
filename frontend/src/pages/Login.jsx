import { Box, Typography, TextField, Button, extendTheme } from "@mui/material";
import { useState } from "react";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  function handleEmail(event) {
    setEmail(event.target.value);
  }
  function handlePassword(event) {
    setPass(event.target.value);
  }
  function handleSignin() {
    if (email.trim() === "" || pass.trim() === "") {
      alert("Please enter email and password!!!");
      return;
    } else {
      console.log("Ready to login");
    }
    console.log(email);
    console.log(pass);
  }

  function testBackend() {
    axios
      .get("http://localhost:5000/")
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }
  return (
    <Box>
      <Typography variant="h4">Smart School Connect</Typography>
      <Typography variant="body1">Welcome Back</Typography>
      <TextField
        label="Email address"
        type="email"
        value={email}
        onChange={handleEmail}
      />
      <TextField
        label="Password"
        type="password"
        value={pass}
        onChange={handlePassword}
      />
      <Button variant="contained" onClick={handleSignin}>
        Sign In
      </Button>
      <Button onClick={testBackend}>Test Backend</Button>
    </Box>
  );
}

export default Login;
