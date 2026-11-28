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

// Fetch data separately from React state updates.
async function fetchParentMessages() {
  const response = await api.get("/messages/parent");
  return response.data.messages || [];
}

const announcementCardSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: 2.5,
  bgcolor: "background.paper",
  backgroundImage: "none",
  boxShadow: "none",
};

function ParentMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    fetchParentMessages()
      .then((receivedMessages) => {
        if (!isActive) return;

        setMessages(receivedMessages);
        setError("");
      })
      .catch((err) => {
        if (!isActive) return;

        setError(
          err.response?.data?.message ||
            "Failed to load announcements. Please try again.",
        );
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString();
  };

  if (loading) {
    return (
      <DashboardLayout title="Announcements">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Announcements">
      <Box sx={{ maxWidth: 1000, mx: "auto", pb: 4 }}>
        {/* Page heading */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <CampaignOutlinedIcon color="primary" sx={{ fontSize: 32 }} />

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Announcements
          </Typography>
        </Stack>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: 3,
            lineHeight: 1.6,
          }}
        >
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
          <Card elevation={0} sx={announcementCardSx}>
            <CardContent
              sx={{
                textAlign: "center",
                py: 6,
                px: 3,
              }}
            >
              <CampaignOutlinedIcon
                sx={{
                  fontSize: 48,
                  mb: 1.5,
                  color: "text.disabled",
                }}
              />

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  mb: 1,
                }}
              >
                No announcements yet
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.6,
                  maxWidth: 450,
                  mx: "auto",
                }}
              >
                School and classroom announcements from your children's teachers
                will appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          /* Announcement list */
          <Stack spacing={2}>
            {messages.map((message) => (
              <Card key={message._id} elevation={0} sx={announcementCardSx}>
                <CardContent
                  sx={{
                    p: { xs: 2, sm: 3 },
                    "&:last-child": {
                      pb: { xs: 2, sm: 3 },
                    },
                  }}
                >
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
                    spacing={1.5}
                    sx={{ mb: 2 }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "text.primary",
                        lineHeight: 1.4,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {message.subject}
                    </Typography>

                    <Chip
                      label={
                        categoryLabels[message.category] || "General Update"
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    />
                  </Stack>

                  {/* Announcement details */}
                  <Stack spacing={0.75} sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 700,
                          color: "text.primary",
                        }}
                      >
                        Teacher:
                      </Box>{" "}
                      {message.createdBy?.name || "Unknown"}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 700,
                          color: "text.primary",
                        }}
                      >
                        Class:
                      </Box>{" "}
                      {message.schoolClass?.name || "Unknown class"}
                    </Typography>
                  </Stack>

                  <Divider sx={{ mb: 2 }} />

                  {/* Announcement content */}
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.primary",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.8,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {message.content}
                  </Typography>

                  {/* Publication date */}
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "text.secondary",
                      mt: 3,
                    }}
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
