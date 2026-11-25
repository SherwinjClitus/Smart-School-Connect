import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import api from "../services/api";
import DashboardLayout from "../components/layout/DashboardLayout";

const categoryLabels = {
  announcement: "Announcement",
  homework_reminder: "Homework Reminder",
  exam_update: "Exam Update",
  general_update: "General Update",
};

function ParentMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/messages/parent");

      setMessages(response.data.messages || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load messages. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        <Typography variant="h4" fontWeight={700} mb={1}>
          Messages
        </Typography>

        <Typography color="text.secondary" mb={3}>
          Stay updated with announcements and messages from your child's
          teachers.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!error && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have received {messages.length} message
            {messages.length !== 1 ? "s" : ""}.
          </Alert>
        )}

        {messages.length === 0 && !error ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" fontWeight={600} mb={1}>
                No messages yet
              </Typography>

              <Typography color="text.secondary">
                Messages and announcements from your child's teachers will
                appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {messages.map((message) => (
              <Card
                key={message._id}
                sx={{
                  borderRadius: 3,
                  boxShadow: 2,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    flexWrap="wrap"
                    gap={1}
                    mb={2}
                  >
                    <Typography variant="h6" fontWeight={700}>
                      {message.subject}
                    </Typography>

                    <Chip
                      label={
                        categoryLabels[message.category] || "General Update"
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>

                  <Stack spacing={0.5} mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Teacher:</strong>{" "}
                      {message.createdBy?.name || "Unknown"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Class:</strong>{" "}
                      {message.schoolClass?.name || "Unknown class"}
                    </Typography>
                  </Stack>

                  <Divider sx={{ mb: 2 }} />

                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.7,
                    }}
                  >
                    {message.content}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mt={3}
                  >
                    Received: {formatDate(message.createdAt)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default ParentMessages;
