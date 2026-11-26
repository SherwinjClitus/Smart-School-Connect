import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import DashboardLayout from "../../../components/layout/DashboardLayout";
import conversationService from "../services/conversationService";

const statusColors = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
  archived: "default",
};

const categoryLabels = {
  attendance: "Attendance",
  urgent: "Urgent",
  academic: "Academic",
  homework: "Homework",
  administrative: "Administrative",
};

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function formatDate(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ConversationDetails() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const currentUser = getCurrentUser();
  const currentRole = currentUser.role || "parent";

  const inboxPath =
    currentRole === "teacher"
      ? "/teacher/conversations"
      : "/parent/conversations";

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState("");

  // Load conversation and its messages
  const loadConversation = async () => {
    try {
      setLoading(true);
      setError("");

      const [conversationData, messageData] = await Promise.all([
        conversationService.getMyConversations(),
        conversationService.getConversationMessages(conversationId),
      ]);

      const currentConversation = (conversationData.conversations || []).find(
        (item) => String(item._id || item.id) === String(conversationId),
      );

      if (!currentConversation) {
        setConversation(null);
        setMessages([]);
        setError("Conversation not found or access denied.");
        return;
      }

      setConversation(currentConversation);
      setMessages(messageData.messages || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load conversation. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  // Send a reply
  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!content.trim() || sending) return;

    try {
      setSending(true);
      setError("");

      await conversationService.sendReply(conversationId, content.trim());

      setContent("");

      await loadConversation();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send your message.");
    } finally {
      setSending(false);
    }
  };

  // Teacher changes conversation status
  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;

    if (!conversation || updatingStatus || currentRole !== "teacher") {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");
      setStatusSuccess("");

      await conversationService.updateStatus(conversationId, newStatus);

      setConversation((previous) => ({
        ...previous,
        status: newStatus,
        resolvedAt:
          newStatus === "resolved" ? new Date().toISOString() : null,
        archivedAt:
          newStatus === "archived" ? new Date().toISOString() : null,
      }));

      const messages = {
        open: "Conversation reopened and moved to your Inbox.",
        in_progress: "Conversation marked as In Progress.",
        resolved: "Conversation resolved and moved to Archived.",
        archived: "Conversation archived successfully.",
      };

      setStatusSuccess(messages[newStatus] || "Status updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update conversation status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isClosed =
    conversation?.status === "resolved" || conversation?.status === "archived";

  // Shared style for the four info cards
  const infoCardSx = {
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
  };

  // Loading screen
  if (loading) {
    return (
      <DashboardLayout>
        <Box
          sx={{
            minHeight: "55vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <CircularProgress />
            <Typography sx={{ color: "text.secondary" }}>
              Loading conversation...
            </Typography>
          </Stack>
        </Box>
      </DashboardLayout>
    );
  }

  // Error screen
  if (error && !conversation) {
    return (
      <DashboardLayout>
        <Box sx={{ maxWidth: 900, mx: "auto", py: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>

          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate(inboxPath)}
              sx={{ textTransform: "none" }}
            >
              Back to Inbox
            </Button>

            <Button
              startIcon={<RefreshRoundedIcon />}
              onClick={loadConversation}
              sx={{ textTransform: "none" }}
            >
              Try Again
            </Button>
          </Stack>
        </Box>
      </DashboardLayout>
    );
  }

  if (!conversation) return null;

  const category =
    categoryLabels[conversation.category] || conversation.category;

  return (
    <DashboardLayout>
      <Box
        sx={{
          maxWidth: 1150,
          mx: "auto",
          pb: 5,
        }}
      >
        {/* Back Navigation */}
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate(inboxPath)}
          sx={{
            mb: 3,
            color: "text.secondary",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              color: "primary.main",
            },
          }}
        >
          Back to Inbox
        </Button>

        {/* Conversation Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 3,
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            background: "linear-gradient(135deg, #ffffff 0%, #f1f6ff 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack
                direction="row"
                sx={{ alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1.5 }}
              >
                <Chip
                  label={category}
                  size="small"
                  color="primary"
                  variant="outlined"
                />

                <Chip
                  label={conversation.priority + " priority"}
                  size="small"
                  color={conversation.priority === "high" ? "error" : "default"}
                  sx={{ textTransform: "capitalize" }}
                />
              </Stack>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#172B4D",
                  letterSpacing: "-0.7px",
                  lineHeight: 1.25,
                  fontSize: { xs: "1.6rem", sm: "2rem" },
                  wordBreak: "break-word",
                }}
              >
                {conversation.subject}
              </Typography>

              <Typography sx={{ color: "text.secondary", mt: 1 }}>
                Conversation with{" "}
                {currentRole === "teacher"
                  ? conversation.parent?.name || "Parent"
                  : conversation.teacher?.name || "Teacher"}
              </Typography>
            </Box>

            {currentRole === "teacher" ? (
              <FormControl
                size="small"
                sx={{
                  minWidth: 160,
                  flexShrink: 0,
                  bgcolor: "#FFFFFF",
                  borderRadius: 2,
                }}
              >
                <InputLabel id="conversation-status-label">Status</InputLabel>
                <Select
                  labelId="conversation-status-label"
                  value={conversation.status}
                  label="Status"
                  onChange={handleStatusChange}
                  disabled={updatingStatus}
                  sx={{
                    borderRadius: 2,
                    textTransform: "capitalize",
                    fontWeight: 700,
                  }}
                >
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Chip
                label={conversation.status.replace("_", " ")}
                color={statusColors[conversation.status] || "default"}
                sx={{
                  textTransform: "capitalize",
                  fontWeight: 700,
                  px: 1,
                  flexShrink: 0,
                }}
              />
            )}
          </Stack>
        </Paper>

        {statusSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {statusSuccess}
          </Alert>
        )}

        {/* Conversation Information */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
            mb: 3,
          }}
        >
          {/* Student */}
          <Card elevation={0} sx={infoCardSx}>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Avatar
                sx={{
                  bgcolor: "#E8F1FF",
                  color: "#2563EB",
                  mb: 1.5,
                }}
              >
                <PersonOutlineRoundedIcon />
              </Avatar>

              <Typography
                variant="caption"
                sx={{ display: "block", color: "text.secondary" }}
              >
                Student
              </Typography>

              <Typography
                sx={{ fontWeight: 700, mt: 0.5, overflowWrap: "anywhere" }}
              >
                {conversation.student?.name || "Unknown"}
              </Typography>
            </CardContent>
          </Card>

          {/* Teacher */}
          <Card elevation={0} sx={infoCardSx}>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Avatar
                sx={{
                  bgcolor: "#E9F8F1",
                  color: "#15976A",
                  mb: 1.5,
                }}
              >
                <SchoolOutlinedIcon />
              </Avatar>

              <Typography
                variant="caption"
                sx={{ display: "block", color: "text.secondary" }}
              >
                Assigned Teacher
              </Typography>

              <Typography
                sx={{ fontWeight: 700, mt: 0.5, overflowWrap: "anywhere" }}
              >
                {conversation.teacher?.name || "Unknown"}
              </Typography>
            </CardContent>
          </Card>

          {/* Class */}
          <Card elevation={0} sx={infoCardSx}>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Avatar
                sx={{
                  bgcolor: "#F3EDFF",
                  color: "#805AD5",
                  mb: 1.5,
                }}
              >
                <ClassOutlinedIcon />
              </Avatar>

              <Typography
                variant="caption"
                sx={{ display: "block", color: "text.secondary" }}
              >
                Class
              </Typography>

              <Typography
                sx={{ fontWeight: 700, mt: 0.5, overflowWrap: "anywhere" }}
              >
                {conversation.schoolClass?.name || "Unknown"}
              </Typography>
            </CardContent>
          </Card>

          {/* Priority */}
          <Card elevation={0} sx={infoCardSx}>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Avatar
                sx={{
                  bgcolor: "#FFF3E8",
                  color: "#E58B26",
                  mb: 1.5,
                }}
              >
                <FlagOutlinedIcon />
              </Avatar>

              <Typography
                variant="caption"
                sx={{ display: "block", color: "text.secondary" }}
              >
                Priority
              </Typography>

              <Typography
                sx={{
                  fontWeight: 700,
                  mt: 0.5,
                  textTransform: "capitalize",
                }}
              >
                {conversation.priority}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Message History */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            mb: 3,
          }}
        >
          {/* Message History Header */}
          <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Message History
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.5 }}
                >
                  {messages.length}{" "}
                  {messages.length === 1 ? "message" : "messages"} in this
                  conversation
                </Typography>
              </Box>

              <Chip
                size="small"
                label="Private conversation"
                variant="outlined"
              />
            </Stack>
          </Box>

          <Divider />

          {/* Messages */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              minHeight: 280,
              maxHeight: 650,
              overflowY: "auto",
              bgcolor: "#F8FAFD",
            }}
          >
            {messages.length === 0 ? (
              <Stack
                spacing={1}
                sx={{
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 230,
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>
                  No messages yet
                </Typography>

                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Start the conversation by sending a message.
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={3}>
                {messages.map((message) => {
                  const isCurrentUser = message.sender?.role === currentRole;

                  return (
                    <Box
                      key={message._id || message.id}
                      sx={{
                        display: "flex",
                        justifyContent: isCurrentUser
                          ? "flex-end"
                          : "flex-start",
                      }}
                    >
                      <Stack
                        direction={isCurrentUser ? "row-reverse" : "row"}
                        spacing={1.5}
                        sx={{
                          alignItems: "flex-end",
                          maxWidth: { xs: "95%", sm: "78%" },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            flexShrink: 0,
                            bgcolor: isCurrentUser ? "#2563EB" : "#64748B",
                            fontWeight: 700,
                          }}
                        >
                          {message.sender?.name?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                              justifyContent: isCurrentUser
                                ? "flex-end"
                                : "flex-start",
                              alignItems: "center",
                              mb: 0.75,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              {message.sender?.name || "Unknown"}
                            </Typography>

                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                textTransform: "capitalize",
                              }}
                            >
                              {message.sender?.role || ""}
                            </Typography>
                          </Stack>

                          <Paper
                            elevation={0}
                            sx={{
                              px: 2.25,
                              py: 1.75,
                              borderRadius: isCurrentUser
                                ? "18px 18px 4px 18px"
                                : "18px 18px 18px 4px",
                              bgcolor: isCurrentUser ? "#2563EB" : "#FFFFFF",
                              color: isCurrentUser ? "#FFFFFF" : "#25334A",
                              border: isCurrentUser
                                ? "none"
                                : "1px solid #E5EAF1",
                              boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
                            }}
                          >
                            <Typography
                              sx={{
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                                lineHeight: 1.7,
                              }}
                            >
                              {message.content}
                            </Typography>
                          </Paper>

                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                              justifyContent: isCurrentUser
                                ? "flex-end"
                                : "flex-start",
                              alignItems: "center",
                              mt: 0.75,
                            }}
                          >
                            <AccessTimeRoundedIcon
                              sx={{
                                fontSize: 13,
                                color: "text.disabled",
                              }}
                            />

                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {formatDate(message.createdAt)}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Paper>

        {/* Reply Composer */}
        {isClosed ? (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Avatar
                sx={{
                  bgcolor: "#E9F8F1",
                  color: "#15976A",
                }}
              >
                <LockOutlinedIcon />
              </Avatar>

              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  Conversation closed
                </Typography>

                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  This conversation has been {conversation.status}. New replies
                  are not allowed.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 4px 18px rgba(15,23,42,0.04)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              Your Reply
            </Typography>

            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Write a message to continue this conversation.
            </Typography>

            <Box component="form" onSubmit={handleSendMessage}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={7}
                placeholder="Write your message here..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
                disabled={sending}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    bgcolor: "#F8FAFD",
                  },
                }}
              />

              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                  mt: 2,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", flex: 1, minWidth: 220 }}
                >
                  Please keep your communication respectful and clear.
                </Typography>

                <Button
                  type="submit"
                  variant="contained"
                  endIcon={<SendRoundedIcon />}
                  disabled={sending || !content.trim()}
                  sx={{
                    flexShrink: 0,
                    borderRadius: 2.5,
                    px: 3,
                    py: 1.2,
                    minHeight: 44,
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "0 5px 14px rgba(37,99,235,0.2)",
                    },
                  }}
                >
                  {sending ? "Sending..." : "Send Reply"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default ConversationDetails;
