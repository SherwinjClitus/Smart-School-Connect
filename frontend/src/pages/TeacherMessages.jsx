
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
} from "@mui/material";

import api from "../services/api";
import DashboardLayout from "../components/layout/DashboardLayout";

const categories = [
  { value: "announcement", label: "Announcement" },
  { value: "homework_reminder", label: "Homework Reminder" },
  { value: "exam_update", label: "Exam Update" },
  { value: "general_update", label: "General Update" },
];

function TeacherMessages() {
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
        err.response?.data?.message || "Failed to load messaging data."
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
      setError("Please select a class and enter both subject and message.");
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
        `Message sent successfully to ${response.data.recipientCount} parent(s).`
      );

      setSubject("");
      setContent("");
      setPreviewOpen(false);

      await loadPageData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send the message."
      );
    } finally {
      setSending(false);
    }
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
          Send announcements and updates to parents of your students.
        </Typography>

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

        <Card sx={{ mb: 4, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Compose Message
            </Typography>

            <Stack spacing={2.5}>
              <TextField
                select
                fullWidth
                label="Select Class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                {classes.map((schoolClass) => (
                  <MenuItem
                    key={schoolClass._id}
                    value={schoolClass._id}
                  >
                    {schoolClass.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Message Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
              />

              <TextField
                fullWidth
                multiline
                minRows={5}
                label="Write your message"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                inputProps={{ maxLength: 5000 }}
                helperText={`${content.length}/5000 characters`}
              />

              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePreview}
                >
                  Preview Message
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Typography variant="h5" fontWeight={700} mb={2}>
          Previously Sent Messages
        </Typography>

        {messages.length === 0 ? (
          <Typography color="text.secondary">
            You haven't sent any messages yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {messages.map((message) => (
              <Card key={message._id} sx={{ borderRadius: 3 }}>
                <CardContent>
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

                    <Chip
                      label={categories.find(
                        (item) => item.value === message.category
                      )?.label || "General Update"}
                      size="small"
                    />
                  </Stack>

                  <Typography color="text.secondary" variant="body2" mb={1}>
                    Class: {message.schoolClass?.name || "Unknown class"}
                  </Typography>

                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                    {message.content}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    variant="caption"
                    display="block"
                    mt={2}
                  >
                    Sent on:{" "}
                    {new Date(message.createdAt).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Preview Message</DialogTitle>

          <DialogContent>
            <Typography fontWeight={700} mt={1}>
              Class
            </Typography>
            <Typography mb={2}>
              {classes.find((item) => item._id === classId)?.name}
            </Typography>

            <Typography fontWeight={700}>Subject</Typography>
            <Typography mb={2}>{subject}</Typography>

            <Typography fontWeight={700}>Message</Typography>
            <Typography sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
              {content}
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPreviewOpen(false)}>
              Edit Message
            </Button>

            <Button
              variant="contained"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}

export default TeacherMessages;
