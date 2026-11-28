import { useEffect, useRef, useState } from "react";

import {
  Avatar,
  Box,
  ButtonBase,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

import api from "../../services/api";
import ReactMarkdown from "react-markdown";
import StellaAvatar, { StellaFaceCapture, useStellaFace } from "./StellaAvatar";

const initialMessage = {
  role: "assistant",
  content:
    "Hi! I'm Stella, an **AI assistant** for your school. I can help with homework, deadlines, submissions and school updates.",
};

const SUGGESTIONS = [
  { label: "What's due this week?", icon: <EventRoundedIcon /> },
  { label: "Check my submissions", icon: <AssignmentTurnedInRoundedIcon /> },
];

const BUBBLE_KEY = "stella-bubble-dismissed";

/*
  Small round Stella beside chat messages. It uses a one-time snapshot of the
  3D model (see StellaAvatar.jsx), so there is no extra WebGL canvas per
  message. Until the snapshot is ready, a sparkle icon shows for a moment.
*/
function StellaBadge({ size = 38 }) {
  const face = useStellaFace();

  return (
    <Avatar
      src={face || undefined}
      alt="Stella"
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        bgcolor: face
          ? (theme) => alpha(theme.palette.primary.main, 0.18)
          : "primary.main",
        color: "primary.contrastText",
        border: 2,
        borderColor: "background.paper",
        boxShadow: 1,
        "& img": { objectFit: "cover", transform: "scale(1.2)" },
      }}
    >
      <AutoAwesomeRoundedIcon sx={{ fontSize: size * 0.55 }} />
    </Avatar>
  );
}

function TypingDots() {
  return (
    <Stack direction="row" spacing={0.6} alignItems="center" sx={{ px: 0.5 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: "text.secondary",
            animation: "stellaDot 1.1s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
            "@keyframes stellaDot": {
              "0%, 80%, 100%": { opacity: 0.3, transform: "translateY(0)" },
              "40%": { opacity: 1, transform: "translateY(-4px)" },
            },
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        />
      ))}
    </Stack>
  );
}

function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBubble, setShowBubble] = useState(false);

  const bottomRef = useRef(null);

  const stellaAnimation = loading ? "lavora" : "fluttua";
  const isFreshChat = messages.length === 1;

  // Greeting bubble: appears once per visit, after a short delay
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(BUBBLE_KEY) === "1";
    } catch {
      /* storage unavailable, show the bubble anyway */
    }
    if (dismissed) return;

    const timer = setTimeout(() => setShowBubble(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  const dismissBubble = () => {
    setShowBubble(false);
    try {
      sessionStorage.setItem(BUBBLE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  // Ask School AI
  const sendMessage = async (question = input) => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) return;

    const previousMessages = messages.filter(
      (message) => message.role === "user" || message.role === "assistant",
    );

    setMessages((previous) => [
      ...previous,
      { role: "user", content: trimmedQuestion },
    ]);

    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/ai/chat", {
        provider: "nemotron",
        question: trimmedQuestion,
        history: previousMessages.slice(-10),
      });

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: response.data.answer },
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to School AI. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Homework summary
  const summarizeHomework = async () => {
    if (loading) return;

    const question = "Summarize my available homework and submission progress.";

    setMessages((previous) => [
      ...previous,
      { role: "user", content: "Summarize my homework" },
    ]);

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/ai/homework-summary", {
        provider: "nemotron",
        question,
      });

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: response.data.answer },
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

  // Reset conversation
  const resetChat = () => {
    setMessages([initialMessage]);
    setInput("");
    setError("");
  };

  const openChat = () => {
    dismissBubble();
    setOpen(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  /* ------------------------------------------------------------------ */
  /* Closed state: launcher                                              */
  /* ------------------------------------------------------------------ */
  if (!open) {
    return (
      <>
        <StellaFaceCapture />
        <Box
          sx={{
            position: "fixed",
            right: { xs: 12, sm: 24 },
            bottom: { xs: 12, sm: 20 },
            zIndex: 1400,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 1,
          }}
        >
          {/* Greeting bubble: says plainly that this is an AI */}
          {showBubble && (
            <Paper
              elevation={6}
              sx={{
                position: "relative",
                width: { xs: 220, sm: 260 },
                p: 1.75,
                pr: 4.5,
                borderRadius: 3,
                borderBottomRightRadius: 6,
                border: 1,
                borderColor: "divider",
                cursor: "pointer",
                animation: "stellaBubbleIn 0.5s ease-out",
                "@keyframes stellaBubbleIn": {
                  from: { opacity: 0, transform: "translateY(10px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
                "@media (prefers-reduced-motion: reduce)": {
                  animation: "none",
                },
              }}
              onClick={openChat}
            >
              <Typography variant="subtitle2" fontWeight={800}>
                Hi, I'm Stella, an AI assistant 👋
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.25 }}
              >
                Ask me about homework, deadlines or submissions.
              </Typography>

              <IconButton
                size="small"
                aria-label="Dismiss greeting"
                onClick={(event) => {
                  event.stopPropagation();
                  dismissBubble();
                }}
                sx={{ position: "absolute", top: 6, right: 6 }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Paper>
          )}

          {/* Avatar + label pill, one big click target */}
          <ButtonBase
            onClick={openChat}
            aria-label="Open Stella, your AI school assistant"
            sx={{
              flexDirection: "column",
              alignItems: "center",
              borderRadius: 4,
              "&:focus-visible": {
                outline: "3px solid",
                outlineColor: "primary.main",
                outlineOffset: 4,
              },
            }}
          >
            <Box
              sx={{
                width: { xs: 130, sm: 160 },
                height: { xs: 130, sm: 160 },
                animation: "stellaFloat 3s ease-in-out infinite",
                filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.18))",
                "@keyframes stellaFloat": {
                  "0%, 100%": { transform: "translateY(0)" },
                  "50%": { transform: "translateY(-10px)" },
                },
                "@media (prefers-reduced-motion: reduce)": {
                  animation: "none",
                },
              }}
            >
              <StellaAvatar
                animation={stellaAnimation}
                width="100%"
                height="100%"
                scale={1.2}
              />
            </Box>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                mt: -1.5,
                pl: 1.5,
                pr: 0.75,
                py: 0.75,
                borderRadius: 99,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                boxShadow: 6,
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.04)" },
              }}
            >
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  bgcolor: "#86EFAC",
                  animation: "stellaPulse 2s ease-out infinite",
                  "@keyframes stellaPulse": {
                    "0%": { boxShadow: "0 0 0 0 rgba(134,239,172,0.7)" },
                    "70%, 100%": { boxShadow: "0 0 0 8px rgba(134,239,172,0)" },
                  },
                  "@media (prefers-reduced-motion: reduce)": {
                    animation: "none",
                  },
                }}
              />
              <Typography variant="body2" fontWeight={800}>
                Ask Stella
              </Typography>
              <Box
                sx={{
                  px: 0.9,
                  py: 0.1,
                  borderRadius: 99,
                  bgcolor: alpha("#fff", 0.22),
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                }}
              >
                AI
              </Box>
            </Stack>
          </ButtonBase>
        </Box>
      </>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Open state: chat window                                             */
  /* ------------------------------------------------------------------ */
  return (
    <>
      <StellaFaceCapture />
      <Paper
        elevation={16}
        role="dialog"
        aria-label="Chat with Stella, AI assistant"
        sx={{
          position: "fixed",
          right: { xs: 8, sm: 24 },
          bottom: { xs: 8, sm: 24 },
          width: { xs: "calc(100vw - 16px)", sm: 400 },
          height: { xs: "calc(100vh - 16px)", sm: 620 },
          maxHeight: "calc(100vh - 32px)",
          zIndex: 1400,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 4,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {/* Header: the one live 3D Stella */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            pl: 1.5,
            pr: 1,
            py: 1,
            color: "primary.contrastText",
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              flexShrink: 0,
              borderRadius: "50%",
              overflow: "hidden",
              bgcolor: alpha("#fff", 0.18),
              border: "2px solid",
              borderColor: alpha("#fff", 0.5),
            }}
          >
            <StellaAvatar
              animation={stellaAnimation}
              width="100%"
              height="100%"
              scale={1.1}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography fontWeight={800} fontSize={18}>
                Stella
              </Typography>
              <Box
                sx={{
                  px: 0.8,
                  borderRadius: 99,
                  bgcolor: alpha("#fff", 0.22),
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: "18px",
                }}
              >
                AI
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  bgcolor: "#86EFAC",
                }}
              />
              <Typography variant="caption" sx={{ opacity: 0.92 }}>
                {loading ? "Thinking…" : "AI school assistant · online"}
              </Typography>
            </Stack>
          </Box>

          <Tooltip title="New conversation">
            <IconButton
              onClick={resetChat}
              size="small"
              aria-label="New conversation"
              sx={{ color: "inherit" }}
            >
              <RestartAltRoundedIcon />
            </IconButton>
          </Tooltip>

          <IconButton
            onClick={() => setOpen(false)}
            size="small"
            aria-label="Close chat"
            sx={{ color: "inherit" }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {/* Conversation */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.75,
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
                {!isUser && <StellaBadge />}

                <Box
                  sx={{
                    maxWidth: "82%",
                    px: 1.75,
                    py: 1.25,
                    borderRadius: 3,
                    borderBottomLeftRadius: isUser ? 12 : 4,
                    borderBottomRightRadius: isUser ? 4 : 12,
                    bgcolor: isUser ? "primary.main" : "background.paper",
                    color: isUser ? "primary.contrastText" : "text.primary",
                    border: isUser ? 0 : 1,
                    borderColor: "divider",
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

          {/* Suggestions: shown until the first question is asked */}
          {isFreshChat && !loading && (
            <Stack spacing={1} sx={{ pl: 5.5 }}>
              <Typography variant="caption" color="text.secondary">
                Try asking:
              </Typography>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                <Chip
                  icon={<MenuBookRoundedIcon />}
                  label="Summarize my homework"
                  onClick={summarizeHomework}
                  color="primary"
                  variant="outlined"
                  clickable
                />
                {SUGGESTIONS.map((suggestion) => (
                  <Chip
                    key={suggestion.label}
                    icon={suggestion.icon}
                    label={suggestion.label}
                    onClick={() => sendMessage(suggestion.label)}
                    color="primary"
                    variant="outlined"
                    clickable
                  />
                ))}
              </Stack>
            </Stack>
          )}

          {/* Thinking indicator */}
          {loading && (
            <Stack direction="row" alignItems="flex-end" spacing={1}>
              <StellaBadge />
              <Paper
                variant="outlined"
                sx={{
                  px: 1.75,
                  py: 1.5,
                  borderRadius: 3,
                  borderBottomLeftRadius: 4,
                }}
              >
                <TypingDots />
              </Paper>
            </Stack>
          )}

          {error && (
            <Typography
              variant="caption"
              color="error"
              role="alert"
              sx={{ textAlign: "center" }}
            >
              {error}
            </Typography>
          )}

          <div ref={bottomRef} />
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
              placeholder="Ask Stella anything…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <IconButton
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              sx={{
                width: 42,
                height: 42,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "&:hover": { bgcolor: "primary.dark" },
                "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
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
            Stella is an AI and can make mistakes. Verify important information.
          </Typography>
        </Box>
      </Paper>
    </>
  );
}

export default FloatingAI;
