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

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
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

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/messages/parent");

      setMessages(response.data.messages || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load announcements. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <DashboardLayout title="Announcements">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Announcements">
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        {/* Page heading */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <CampaignOutlinedIcon color="primary" sx={{ fontSize: 32 }} />

          <Typography variant="h4" fontWeight={700}>
            Announcements
          </Typography>
        </Stack>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Stay informed about important school and classroom updates.
        </Typography>

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Announcement count */}
        {!error && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have received {messages.length} announcement
            {messages.length !== 1 ? "s" : ""}.
          </Alert>
        )}

        {/* Empty state */}
        {messages.length === 0 && !error ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <CampaignOutlinedIcon
                color="disabled"
                sx={{ fontSize: 48, mb: 1 }}
              />

              <Typography variant="h6" fontWeight={600} mb={1}>
                No announcements yet
              </Typography>

              <Typography color="text.secondary">
                School and classroom announcements from your children's teachers
                will appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          /* Announcement list */
          <Stack spacing={2}>
            {messages.map((message) => (
              <Card
                key={message._id}
                sx={{
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  {/* Subject and category */}
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    justifyContent="space-between"
                    alignItems={{
                      xs: "flex-start",
                      sm: "center",
                    }}
                    spacing={1}
                    sx={{ mb: 2 }}
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

                  {/* Announcement details */}
                  <Stack spacing={0.5} sx={{ mb: 2 }}>
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

                  {/* Announcement content */}
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.7,
                    }}
                  >
                    {message.content}
                  </Typography>

                  {/* Date */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mt: 3 }}
                  >
                    Published: {formatDate(message.createdAt)}
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
