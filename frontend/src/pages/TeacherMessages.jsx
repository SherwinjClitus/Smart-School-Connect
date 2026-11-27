import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";

import api from "../services/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import CategoryChip from "../components/common/CategoryChip";

const categories = [
  { value: "announcement", label: "Announcement" },
  { value: "homework_reminder", label: "Homework Reminder" },
  { value: "exam_update", label: "Exam Update" },
  { value: "general_update", label: "General Update" },
];

function TeacherMessages() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [classes, setClasses] = useState([]);
  const [messages, setMessages] = useState([]);

  const [classId, setClassId] = useState("");
  const [category, setCategory] = useState("general_update");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const cardSx = {
    bgcolor: "background.paper",
    color: "text.primary",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 3,
    boxShadow: isDark
      ? "0 2px 8px rgba(0,0,0,0.18)"
      : "0 2px 8px rgba(15,23,42,0.04)",
  };

  const fieldSx = {
    "& .MuiInputLabel-root": {
      color: "text.secondary",
    },
    "& .MuiInputBase-root": {
      color: "text.primary",
      bgcolor: "background.paper",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "divider",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "text.secondary",
    },
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [classResponse, messageResponse] = await Promise.all([
        api.get("/classes/my-classes"),
        api.get("/messages/teacher"),
      ]);

      setClasses(classResponse.data.classes || []);
      setMessages(messageResponse.data.messages || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load announcement data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const handlePreview = () => {
    setError("");
    setSuccess("");

    if (!classId || !subject.trim() || !content.trim()) {
      setError(
        "Please select a class and enter both subject and announcement.",
      );
      return;
    }

    setPreviewOpen(true);
  };

  const handleSend = async () => {
    try {
      setSending(true);
      setError("");
      setSuccess("");

      const response = await api.post("/messages", {
        classId,
        category,
        subject: subject.trim(),
        content: content.trim(),
      });

      setSuccess(
        `Announcement sent successfully to ${response.data.recipientCount} recipient(s).`,
      );

      setSubject("");
      setContent("");
      setPreviewOpen(false);

      await loadPageData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send the announcement.",
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
          bgcolor="background.default"
        >
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box
        sx={{
          maxWidth: 1000,
          mx: "auto",
          color: "text.primary",
        }}
      >
        {/* Page Heading */}
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
          <CampaignOutlinedIcon color="primary" sx={{ fontSize: 34 }} />

          <Typography variant="h4" fontWeight={700}>
            Announcements
          </Typography>
        </Stack>

        <Typography color="text.secondary" mb={3}>
          Share official school and class updates with students and their
          parents.
        </Typography>

        {/* Explanation */}
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Announcements are official class-wide updates, such as exam schedules,
          holidays, homework reminders, and school events. For private
          discussions about an individual student, use Direct Messages.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Create Announcement */}
        <Card sx={{ ...cardSx, mb: 4 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={700} mb={1}>
              Create Announcement
            </Typography>

            <Typography color="text.secondary" variant="body2" mb={3}>
              Your announcement will be shared with the selected class's
              recipients.
            </Typography>

            <Stack spacing={2.5}>
              <TextField
                select
                fullWidth
                label="Select Class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                sx={fieldSx}
                slotProps={{
                  select: {
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: "background.paper",
                          color: "text.primary",
                        },
                      },
                    },
                  },
                }}
              >
                {classes.map((schoolClass) => (
                  <MenuItem key={schoolClass._id} value={schoolClass._id}>
                    {schoolClass.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Announcement Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={fieldSx}
                slotProps={{
                  select: {
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: "background.paper",
                          color: "text.primary",
                        },
                      },
                    },
                  },
                }}
              >
                {categories.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                sx={fieldSx}
              />

              <TextField
                fullWidth
                multiline
                minRows={5}
                label="Write your announcement"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                slotProps={{
                  htmlInput: {
                    maxLength: 5000,
                  },
                }}
                helperText={`${content.length}/5000 characters`}
                sx={fieldSx}
              />

              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePreview}
                >
                  Preview Announcement
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Sent Announcements */}
        <Typography variant="h5" fontWeight={700} mb={2}>
          Sent Announcements
        </Typography>

        {messages.length === 0 ? (
          <Card sx={cardSx}>
            <CardContent sx={{ py: 4, textAlign: "center" }}>
              <CampaignOutlinedIcon
                color="disabled"
                sx={{ fontSize: 42, mb: 1 }}
              />

              <Typography fontWeight={600}>No announcements yet</Typography>

              <Typography color="text.secondary" variant="body2">
                Your sent announcements will appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {messages.map((message) => (
              <Card key={message._id} sx={cardSx}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={1}
                    mb={1}
                  >
                    <Typography variant="h6" fontWeight={700}>
                      {message.subject}
                    </Typography>

                    <CategoryChip category={message.category} />
                  </Stack>

                  <Typography color="text.secondary" variant="body2" mb={1}>
                    Class: {message.schoolClass?.name || "Unknown class"}
                  </Typography>

                  <Typography
                    sx={{
                      whiteSpace: "pre-wrap",
                      color: "text.primary",
                      lineHeight: 1.7,
                    }}
                  >
                    {message.content}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    variant="caption"
                    display="block"
                    mt={2}
                  >
                    Sent on: {new Date(message.createdAt).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              bgcolor: "background.paper",
              color: "text.primary",
              backgroundImage: "none",
            },
          }}
        >
          <DialogTitle>Preview Announcement</DialogTitle>

          <DialogContent>
            <Typography fontWeight={700} mt={1}>
              Class
            </Typography>

            <Typography color="text.secondary" mb={2}>
              {classes.find((item) => item._id === classId)?.name}
            </Typography>

            <Typography fontWeight={700}>Category</Typography>

            <Typography color="text.secondary" mb={2}>
              {categories.find((item) => item.value === category)?.label}
            </Typography>

            <Typography fontWeight={700}>Subject</Typography>

            <Typography color="text.secondary" mb={2}>
              {subject}
            </Typography>

            <Typography fontWeight={700}>Announcement</Typography>

            <Typography
              sx={{
                whiteSpace: "pre-wrap",
                mt: 1,
                color: "text.primary",
                lineHeight: 1.7,
              }}
            >
              {content}
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPreviewOpen(false)}>
              Edit Announcement
            </Button>

            <Button variant="contained" onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}

export default TeacherMessages;
