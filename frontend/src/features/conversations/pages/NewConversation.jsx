import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";

import DashboardLayout from "../../../components/layout/DashboardLayout";
import api from "../../../services/api";
import conversationService from "../services/conversationService";

const categories = [
  { value: "attendance", label: "Attendance" },
  { value: "urgent", label: "Urgent" },
  { value: "academic", label: "Academic" },
  { value: "homework", label: "Homework" },
  { value: "administrative", label: "Administrative" },
];

const formCardSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: 3,
  bgcolor: "background.paper",
  backgroundImage: "none",
  boxShadow: "none",
};

function NewConversation() {
  const navigate = useNavigate();

  const [children, setChildren] = useState([]);
  const [studentId, setStudentId] = useState("");

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("academic");
  const [content, setContent] = useState("");

  const [loadingChildren, setLoadingChildren] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load children linked to the logged-in parent
  useEffect(() => {
    const loadChildren = async () => {
      try {
        setLoadingChildren(true);
        setError("");

        const response = await api.get("/homework/parent");

        const linkedChildren = Array.isArray(response.data.children)
          ? response.data.children
          : [];

        const formattedChildren = linkedChildren
          .map((item) => {
            const child = item.child || {};
            const id = child._id || child.id;

            if (!id) return null;

            return {
              studentId: String(id),
              studentName: child.name || "Unnamed Student",
            };
          })
          .filter(Boolean);

        setChildren(formattedChildren);

        if (formattedChildren.length > 0) {
          setStudentId(formattedChildren[0].studentId);
        } else {
          setStudentId("");
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load your linked children.",
        );
      } finally {
        setLoadingChildren(false);
      }
    };

    loadChildren();
  }, []);

  const selectedChild = children.find((child) => child.studentId === studentId);

  // Create the conversation
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!studentId) {
      setError("Please select a child.");
      return;
    }

    if (!/^[a-fA-F0-9]{24}$/.test(studentId)) {
      setError("Invalid student ID. Please refresh the page and try again.");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (subject.trim().length > 150) {
      setError("Subject cannot exceed 150 characters.");
      return;
    }

    if (!content.trim()) {
      setError("Please enter your message.");
      return;
    }

    if (content.trim().length > 5000) {
      setError("Message cannot exceed 5000 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await conversationService.createConversation({
        studentId,
        subject: subject.trim(),
        category,
        content: content.trim(),
      });

      const conversation = response.conversation || response;

      const conversationId = conversation._id || conversation.id;

      if (!conversationId) {
        throw new Error(
          "Conversation was created, but its ID was not returned.",
        );
      }

      navigate(`/parent/conversations/${conversationId}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create conversation. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Direct Messages">
      <Box sx={{ maxWidth: 850, mx: "auto", pb: 4 }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/parent/conversations")}
          sx={{
            mb: 2,
            textTransform: "none",
          }}
          disabled={submitting}
        >
          Back to Inbox
        </Button>

        {/* Page Heading */}
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            gap: 1.5,
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              flexShrink: 0,
              borderRadius: 2,
              bgcolor: "action.selected",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ForumOutlinedIcon />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "text.primary",
                lineHeight: 1.3,
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              New Conversation
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                lineHeight: 1.5,
              }}
            >
              Start a private conversation with your child's teacher.
            </Typography>
          </Box>
        </Stack>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Form Card */}
        <Card elevation={0} sx={formCardSx}>
          <CardContent
            sx={{
              p: { xs: 2, sm: 3 },
              "&:last-child": {
                pb: { xs: 2, sm: 3 },
              },
            }}
          >
            {loadingChildren ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 7,
                }}
              >
                <CircularProgress />
              </Box>
            ) : children.length === 0 ? (
              <Alert severity="warning">
                No linked children were found in your account. Please contact
                the school administrator.
              </Alert>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  {/* Child Selection */}
                  <TextField
                    select
                    fullWidth
                    required
                    label="Select Child"
                    value={studentId}
                    onChange={(event) => {
                      setStudentId(event.target.value);
                      setError("");
                    }}
                    disabled={submitting}
                  >
                    {children.map((child) => (
                      <MenuItem key={child.studentId} value={child.studentId}>
                        {child.studentName}
                      </MenuItem>
                    ))}
                  </TextField>

                  {selectedChild && (
                    <Alert severity="info">
                      This conversation will be about{" "}
                      <strong>{selectedChild.studentName}</strong>. The assigned
                      class teacher will be selected automatically.
                    </Alert>
                  )}

                  {/* Subject */}
                  <TextField
                    fullWidth
                    required
                    label="Subject"
                    placeholder="e.g. Regarding my child's absence"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    slotProps={{
                      htmlInput: { maxLength: 150 },
                      formHelperText: {
                        sx: { textAlign: "right" },
                      },
                    }}
                    helperText={`${subject.length}/150 characters`}
                    disabled={submitting}
                  />

                  {/* Category */}
                  <TextField
                    select
                    fullWidth
                    required
                    label="Conversation Category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    disabled={submitting}
                  >
                    {categories.map((item) => (
                      <MenuItem key={item.value} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  {/* First Message */}
                  <TextField
                    fullWidth
                    required
                    multiline
                    minRows={5}
                    maxRows={10}
                    label="Your Message"
                    placeholder="Explain what you would like to discuss with the teacher..."
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    slotProps={{
                      htmlInput: { maxLength: 5000 },
                      formHelperText: {
                        sx: { textAlign: "right" },
                      },
                    }}
                    helperText={`${content.length}/5000 characters`}
                    disabled={submitting}
                  />

                  {/* Information */}
                  <Alert severity="info">
                    You can reply to the conversation while it is open or in
                    progress. Only the teacher can change its status.
                  </Alert>

                  {/* Actions */}
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "flex-end",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1.5,
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => navigate("/parent/conversations")}
                      disabled={submitting}
                      sx={{
                        textTransform: "none",
                        minHeight: 40,
                      }}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SendRoundedIcon />}
                      disabled={
                        submitting ||
                        !studentId ||
                        !subject.trim() ||
                        !content.trim()
                      }
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 2,
                        minHeight: 40,
                      }}
                    >
                      {submitting ? "Creating..." : "Create Conversation"}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}

export default NewConversation;
