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

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";

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

function NewConversation() {
  const navigate = useNavigate();

  // Form state
  const [children, setChildren] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("academic");
  const [content, setContent] = useState("");

  // Loading and error state
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch children linked to the logged-in parent
  useEffect(() => {
    const loadChildren = async () => {
      try {
        setLoadingChildren(true);
        setError("");

        const response = await api.get("/homework/parent");

        const linkedChildren = Array.isArray(response.data.children)
          ? response.data.children
          : [];

        // Support both Mongoose id and _id properties
        const formattedChildren = linkedChildren
          .map((item) => {
            const childId = item.child?.id || item.child?._id;

            if (!childId) {
              return null;
            }

            return {
              studentId: String(childId),
              studentName: item.child.name || "Unnamed Student",
            };
          })
          .filter(Boolean);

        setChildren(formattedChildren);

        // Automatically select the first linked child
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

  // Handle child selection
  const handleChildChange = (event) => {
    setStudentId(event.target.value);
    setError("");
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // Validate selected child
    if (!studentId) {
      setError("Please select a child.");
      return;
    }

    if (!/^[a-fA-F0-9]{24}$/.test(studentId)) {
      setError("Invalid student ID. Please refresh the page and try again.");
      return;
    }

    // Validate subject
    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (subject.trim().length > 150) {
      setError("Subject cannot exceed 150 characters.");
      return;
    }

    // Validate message
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

      const payload = {
        studentId,
        subject: subject.trim(),
        category,
        content: content.trim(),
      };

      const response = await conversationService.createConversation(payload);

      const conversationId =
        response.conversation?._id ||
        response.conversation?.id ||
        response._id ||
        response.id;

      if (!conversationId) {
        throw new Error("The server did not return a conversation ID.");
      }

      // Navigate to the created conversation
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

  // Find selected child
  const selectedChild = children.find((child) => child.studentId === studentId);

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 850, mx: "auto" }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/parent/conversations")}
          sx={{ mb: 2 }}
          disabled={submitting}
        >
          Back to Inbox
        </Button>

        {/* Page Heading */}
        <Typography variant="h4" fontWeight={700}>
          New Conversation
        </Typography>

        <Typography color="text.secondary" mt={0.5} mb={3}>
          Start a private conversation with your child's teacher.
        </Typography>

        {/* Conversation Form */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            {/* Loading State */}
            {loadingChildren ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                py={6}
              >
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Error Message */}
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                {/* No Children */}
                {children.length === 0 ? (
                  <Alert severity="warning">
                    No linked children were found in your account. Please
                    contact the school administrator.
                  </Alert>
                ) : (
                  <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                      {/* Child Selection */}
                      <TextField
                        select
                        fullWidth
                        required
                        label="Select Child"
                        value={studentId}
                        onChange={handleChildChange}
                        disabled={submitting}
                      >
                        {children.map((child) => (
                          <MenuItem
                            key={child.studentId}
                            value={child.studentId}
                          >
                            {child.studentName}
                          </MenuItem>
                        ))}
                      </TextField>

                      {/* Selected Child Information */}
                      {selectedChild && (
                        <Alert severity="success">
                          Selected child: {selectedChild.studentName}
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
                        inputProps={{ maxLength: 150 }}
                        helperText={`${subject.length}/150 characters`}
                        disabled={submitting}
                      />

                      {/* Conversation Category */}
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
                        inputProps={{ maxLength: 5000 }}
                        helperText={`${content.length}/5000 characters`}
                        disabled={submitting}
                      />

                      {/* Information */}
                      <Alert severity="info">
                        Your conversation will be sent to the teacher assigned
                        to the selected child's class.
                      </Alert>

                      {/* Action Buttons */}
                      <Stack
                        direction="row"
                        justifyContent="flex-end"
                        gap={2}
                        flexWrap="wrap"
                      >
                        <Button
                          variant="outlined"
                          onClick={() => navigate("/parent/conversations")}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>

                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<SendIcon />}
                          disabled={
                            submitting ||
                            !studentId ||
                            !subject.trim() ||
                            !content.trim()
                          }
                        >
                          {submitting ? "Creating..." : "Create Conversation"}
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}

export default NewConversation;
