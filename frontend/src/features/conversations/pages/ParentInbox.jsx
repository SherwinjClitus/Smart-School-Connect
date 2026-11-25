import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";

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

function ParentInbox() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await conversationService.getMyConversations();

      setConversations(data.conversations || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load your conversations.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        {/* Page Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          mb={1}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Parent Inbox
            </Typography>

            <Typography color="text.secondary" mt={0.5}>
              Communicate with your child's teachers.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/parent/conversations/new")}
          >
            New Conversation
          </Button>
        </Stack>

        {/* Conversation Statistics */}
        <Stack direction="row" spacing={1} mb={3} mt={2}>
          <Chip
            label={`${conversations.length} Conversations`}
            variant="outlined"
          />

          <Chip
            label={`${
              conversations.filter(
                (item) =>
                  item.status === "open" || item.status === "in_progress",
              ).length
            } Active`}
            color="warning"
          />
        </Stack>

        {/* Loading State */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : error ? (
          /* Error State */
          <Alert severity="error">{error}</Alert>
        ) : conversations.length === 0 ? (
          /* Empty State */
          <Card sx={{ borderRadius: 3 }}>
            <CardContent
              sx={{
                textAlign: "center",
                py: 7,
              }}
            >
              <ChatBubbleOutlineOutlinedIcon
                sx={{
                  fontSize: 50,
                  color: "text.secondary",
                  mb: 1,
                }}
              />

              <Typography variant="h6" fontWeight={600}>
                No conversations yet
              </Typography>

              <Typography color="text.secondary" mt={1} mb={2}>
                Start a conversation with your child's teacher.
              </Typography>

              <Button
                variant="contained"
                onClick={() => navigate("/parent/conversations/new")}
              >
                Start a Conversation
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Conversation List */
          <Stack spacing={2}>
            {conversations.map((conversation) => (
              <Card
                key={conversation._id}
                onClick={() =>
                  navigate(`/parent/conversations/${conversation._id}`)
                }
                sx={{
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Subject and Status */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    flexWrap="wrap"
                    gap={1}
                    mb={1.5}
                  >
                    <Typography variant="h6" fontWeight={700}>
                      {conversation.subject}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={
                          categoryLabels[conversation.category] ||
                          conversation.category
                        }
                        size="small"
                        variant="outlined"
                      />

                      <Chip
                        label={conversation.status.replace("_", " ")}
                        size="small"
                        color={statusColors[conversation.status] || "default"}
                      />
                    </Stack>
                  </Stack>

                  {/* Conversation Details */}
                  <Typography color="text.secondary" variant="body2">
                    Student: {conversation.student?.name || "Unknown"}
                  </Typography>

                  <Typography color="text.secondary" variant="body2">
                    Teacher: {conversation.teacher?.name || "Unknown"}
                  </Typography>

                  <Typography color="text.secondary" variant="body2">
                    Class: {conversation.schoolClass?.name || "Unknown"}
                  </Typography>

                  {/* Priority and Last Activity */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={2}
                    flexWrap="wrap"
                    gap={1}
                  >
                    <Chip
                      label={`${conversation.priority} priority`}
                      size="small"
                      color={
                        conversation.priority === "high" ? "error" : "default"
                      }
                    />

                    <Typography variant="caption" color="text.secondary">
                      Last activity:{" "}
                      {conversation.lastMessageAt
                        ? new Date(conversation.lastMessageAt).toLocaleString()
                        : "Not available"}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default ParentInbox;
