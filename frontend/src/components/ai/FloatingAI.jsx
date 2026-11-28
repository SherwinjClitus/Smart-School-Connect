import { useState } from "react";

import {
  Avatar,
  Badge,
  Box,
  CircularProgress,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
  Tooltip,
} from "@mui/material";

import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

import api from "../../services/api";
import ReactMarkdown from "react-markdown";

const initialMessage = {
  role: "assistant",
  content:
    "Hello! I'm your Smart School AI assistant. Ask me about homework, deadlines, submissions, or school updates.",
};

function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async (question = input) => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) return;

    const previousMessages = messages.filter(
      (message) => message.role === "user" || message.role === "assistant",
    );

    const userMessage = {
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/ai/chat", {
        provider: "nemotron",
        question: trimmedQuestion,
        history: previousMessages.slice(-10),
      });

      const assistantMessage = {
        role: "assistant",
        content: response.data.answer,
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to School AI. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const summarizeHomework = async () => {
    if (loading) return;

    const question = "Summarize my available homework and submission progress.";

    const userMessage = {
      role: "user",
      content: "Summarize my homework",
    };

    setMessages((previous) => [...previous, userMessage]);
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/ai/homework-summary", {
        provider: "nemotron",
        question,
      });

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: response.data.answer,
        },
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to summarize homework. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([initialMessage]);
    setInput("");
    setError("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating chatbot window */}
      {open && (
        <Paper
          elevation={12}
          sx={{
            position: "fixed",
            right: { xs: 12, sm: 24 },
            bottom: { xs: 88, sm: 100 },
            width: { xs: "calc(100vw - 24px)", sm: 380 },
            maxWidth: 420,
            height: { xs: "min(70vh, 560px)", sm: 540 },
            maxHeight: "calc(100vh - 120px)",
            zIndex: 1400,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              px: 2,
              py: 1.75,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "inherit",
              }}
            >
              <SmartToyRoundedIcon />
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={800}>Smart School AI</Typography>

              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: "#86EFAC",
                  }}
                />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Powered by Nemotron
                </Typography>
              </Stack>
            </Box>

            <Tooltip title="New conversation">
              <IconButton
                onClick={resetChat}
                size="small"
                sx={{ color: "inherit" }}
              >
                <RestartAltRoundedIcon />
              </IconButton>
            </Tooltip>

            <IconButton
              onClick={() => setOpen(false)}
              size="small"
              sx={{ color: "inherit" }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          {/* Quick actions */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              px: 1.5,
              py: 1.25,
              borderBottom: 1,
              borderColor: "divider",
              overflowX: "auto",
            }}
          >
            <Chip
              icon={<AutoAwesomeRoundedIcon />}
              label="Ask AI"
              size="small"
              color="primary"
              variant="outlined"
            />

            <Chip
              icon={<MenuBookRoundedIcon />}
              label="Summarize homework"
              size="small"
              onClick={summarizeHomework}
              disabled={loading}
              clickable
            />
          </Stack>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              bgcolor: "background.default",
            }}
          >
            {messages.map((message, index) => {
              const isUser = message.role === "user";

              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                    gap: 1,
                  }}
                >
                  {!isUser && (
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "primary.main",
                      }}
                    >
                      <SmartToyRoundedIcon sx={{ fontSize: 17 }} />
                    </Avatar>
                  )}

                  <Box
                    sx={{
                      maxWidth: "84%",
                      px: 1.75,
                      py: 1.25,
                      borderRadius: 2.5,
                      bgcolor: isUser ? "primary.main" : "background.paper",
                      color: isUser ? "primary.contrastText" : "text.primary",
                      border: isUser ? 0 : 1,
                      borderColor: "divider",
                      boxShadow: isUser ? "none" : 1,
                      overflowWrap: "anywhere",
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <Typography
                            variant="body2"
                            sx={{
                              lineHeight: 1.65,
                              mb: 1,
                              "&:last-child": { mb: 0 },
                            }}
                          >
                            {children}
                          </Typography>
                        ),
                        strong: ({ children }) => (
                          <Box component="strong" sx={{ fontWeight: 800 }}>
                            {children}
                          </Box>
                        ),
                        ul: ({ children }) => (
                          <Box component="ul" sx={{ pl: 2.5, my: 1 }}>
                            {children}
                          </Box>
                        ),
                        ol: ({ children }) => (
                          <Box component="ol" sx={{ pl: 2.5, my: 1 }}>
                            {children}
                          </Box>
                        ),
                        li: ({ children }) => (
                          <Box component="li" sx={{ mb: 0.5 }}>
                            <Typography variant="body2" component="span">
                              {children}
                            </Typography>
                          </Box>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </Box>
                </Box>
              );
            })}

            {loading && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: "primary.main",
                  }}
                >
                  <SmartToyRoundedIcon sx={{ fontSize: 17 }} />
                </Avatar>

                <Paper
                  variant="outlined"
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderRadius: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CircularProgress size={15} />
                  <Typography variant="caption" color="text.secondary">
                    Thinking...
                  </Typography>
                </Paper>
              </Stack>
            )}

            {error && (
              <Typography
                variant="caption"
                color="error"
                sx={{ textAlign: "center" }}
              >
                {error}
              </Typography>
            )}
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 1.5,
              borderTop: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Stack direction="row" alignItems="flex-end" spacing={1}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                size="small"
                placeholder="Ask me anything..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />

              <IconButton
                color="primary"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "action.disabledBackground",
                  },
                }}
              >
                <SendRoundedIcon />
              </IconButton>
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1, textAlign: "center" }}
            >
              AI can make mistakes. Verify important information.
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Floating button */}
      <Tooltip title="Chat with School AI" placement="left">
        <Fab
          color="primary"
          aria-label="Open School AI assistant"
          onClick={() => setOpen((previous) => !previous)}
          sx={{
            position: "fixed",
            right: { xs: 16, sm: 24 },
            bottom: { xs: 16, sm: 24 },
            zIndex: 1401,
            width: 60,
            height: 60,
            boxShadow: 5,
            transition: "transform 0.2s ease",
            "&:hover": {
              transform: "scale(1.08)",
            },
          }}
        >
          {open ? (
            <CloseRoundedIcon />
          ) : (
            <Badge
              color="success"
              variant="dot"
              overlap="circular"
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <SmartToyRoundedIcon sx={{ fontSize: 30 }} />
            </Badge>
          )}
        </Fab>
      </Tooltip>
    </>
  );
}

export default FloatingAI;
