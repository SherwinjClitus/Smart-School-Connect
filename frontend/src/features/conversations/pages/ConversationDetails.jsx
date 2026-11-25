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
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import DashboardLayout from "../../../components/layout/DashboardLayout";
import conversationService from "../services/conversationService";

const statusColors = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
  archived: "default",
};

function ConversationDetails() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadConversation = async () => {
    try {
      setLoading(true);
      setError("");

      const [conversationData, messageData] = await Promise.all([
        conversationService.getMyConversations(),
        conversationService.getConversationMessages(conversationId),
      ]);

      const currentConversation = (conversationData.conversations || []).find(
        (item) => item._id === conversationId,
      );

      if (!currentConversation) {
        setError("Conversation not found or access denied.");
        return;
      }

      setConversation(currentConversation);
      setMessages(messageData.messages || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load conversation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!content.trim()) return;

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

  const isClosed =
    conversation?.status === "resolved" || conversation?.status === "archived";

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error && !conversation) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>

        <Button onClick={() => navigate("/parent/conversations")}>
          Back to Inbox
        </Button>
      </DashboardLayout>
    );
  }

  if (!conversation) return null;

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          mb={3}
        >
          <Box>
            <Button
              onClick={() => navigate("/parent/conversations")}
              sx={{ mb: 1, px: 0 }}
            >
              ← Back to Inbox
            </Button>

            <Typography variant="h4" fontWeight={700}>
              {conversation.subject}
            </Typography>

            <Typography color="text.secondary" mt={0.5}>
              Conversation with {conversation.teacher?.name || "Teacher"}
            </Typography>
          </Box>

          <Chip
            label={conversation.status.replace("_", " ")}
            color={statusColors[conversation.status] || "default"}
          />
        </Stack>

        {/* Conversation Information */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Stack direction="row" flexWrap="wrap" gap={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Student
                </Typography>
                <Typography fontWeight={600}>
                  {conversation.student?.name || "Unknown"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Teacher
                </Typography>
                <Typography fontWeight={600}>
                  {conversation.teacher?.name || "Unknown"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography fontWeight={600}>
                  {conversation.category}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Priority
                </Typography>
                <Typography fontWeight={600}>
                  {conversation.priority}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Message History */}
        <Paper
          elevation={1}
          sx={{
            borderRadius: 3,
            p: { xs: 2, sm: 3 },
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700} mb={2}>
            Message History
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {messages.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No messages found.
            </Typography>
          ) : (
            <Stack spacing={3}>
              {messages.map((message) => {
                const isParentMessage = message.sender?.role === "parent";

                return (
                  <Box
                    key={message._id}
                    sx={{
                      display: "flex",
                      justifyContent: isParentMessage
                        ? "flex-end"
                        : "flex-start",
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: "80%",
                        display: "flex",
                        gap: 1.5,
                        flexDirection: isParentMessage ? "row-reverse" : "row",
                        alignItems: "flex-start",
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: isParentMessage
                            ? "primary.main"
                            : "secondary.main",
                          width: 36,
                          height: 36,
                        }}
                      >
                        {message.sender?.name?.charAt(0)?.toUpperCase() || "U"}
                      </Avatar>

                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          justifyContent={
                            isParentMessage ? "flex-end" : "flex-start"
                          }
                          mb={0.5}
                        >
                          <Typography variant="body2" fontWeight={700}>
                            {message.sender?.name || "Unknown"}
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            {message.sender?.role || ""}
                          </Typography>
                        </Stack>

                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: isParentMessage
                              ? "primary.light"
                              : "grey.100",
                            color: isParentMessage
                              ? "primary.contrastText"
                              : "text.primary",
                          }}
                        >
                          <Typography sx={{ whiteSpace: "pre-wrap" }}>
                            {message.content}
                          </Typography>
                        </Paper>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          textAlign={isParentMessage ? "right" : "left"}
                          mt={0.5}
                        >
                          {new Date(message.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Paper>

        {/* Reply Section */}
        {isClosed ? (
          <Alert severity="info">
            This conversation has been {conversation.status}. New replies are
            not allowed.
          </Alert>
        ) : (
          <Paper elevation={1} sx={{ borderRadius: 3, p: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Your Reply
            </Typography>

            <Box component="form" onSubmit={handleSendMessage}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
                placeholder="Write your message to the teacher..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
                disabled={sending}
              />

              <Stack direction="row" justifyContent="flex-end" mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={sending || !content.trim()}
                >
                  {sending ? "Sending..." : "Send Reply"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}

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
