import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";

import DashboardLayout from "../../../components/layout/DashboardLayout";
import api from "../../../services/api";
import conversationService from "../services/conversationService";

function TeacherNewConversation() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [studentId, setStudentId] = useState("");

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("academic");
  const [priority, setPriority] = useState("normal");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Theme-aware form styles
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
    "& .MuiSelect-icon": {
      color: "text.secondary",
    },
    "& .MuiFormHelperText-root": {
      color: "text.secondary",
    },
  };

  const menuProps = {
    PaperProps: {
      sx: {
        bgcolor: "background.paper",
        color: "text.primary",
        backgroundImage: "none",
        border: `1px solid ${theme.palette.divider}`,
      },
    },
  };

  // Load teacher's classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/classes/my-classes");
        setClasses(response.data.classes || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load your classes.");
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []);

  // Update students when class changes
  const handleClassChange = (event) => {
    const classId = event.target.value;

    setSelectedClass(classId);
    setStudentId("");

    const currentClass = classes.find((item) => item._id === classId);

    setStudents(currentClass?.students || []);
  };

  // Create conversation
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedClass || !studentId || !subject.trim() || !content.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (subject.trim().length > 150) {
      setError("Subject cannot exceed 150 characters.");
      return;
    }

    if (content.trim().length > 5000) {
      setError("Message cannot exceed 5000 characters.");
      return;
    }

    if (!["normal", "high"].includes(priority)) {
      setError("Please select a valid priority.");
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await conversationService.createConversation({
        studentId,
        subject: subject.trim(),
        category,
        priority,
        content: content.trim(),
      });

      const conversation = response.conversation || response;
      const conversationId = conversation._id || conversation.id;

      if (!conversationId) {
        throw new Error(
          "Conversation was created, but its ID was not returned.",
        );
      }

      navigate(`/teacher/conversations/${conversationId}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create conversation. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout title="Direct Messages">
      <Box
        sx={{
          maxWidth: 850,
          mx: "auto",
          pb: 4,
          color: "text.primary",
        }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: isDark ? "rgba(96,165,250,0.16)" : "#EAF2FF",
              color: isDark ? "#93C5FD" : "#1976D2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ForumOutlinedIcon />
          </Box>

          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "text.primary",
              }}
            >
              New Conversation
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Start a private conversation with a student's parent.
            </Typography>
          </Box>
        </Stack>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 8,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Card
            elevation={0}
            sx={{
              bgcolor: "background.paper",
              color: "text.primary",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              backgroundImage: "none",
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  {/* Class */}
                  <FormControl fullWidth size="small" required sx={fieldSx}>
                    <InputLabel id="class-label">Select Class</InputLabel>

                    <Select
                      labelId="class-label"
                      value={selectedClass}
                      label="Select Class"
                      onChange={handleClassChange}
                      MenuProps={menuProps}
                    >
                      {classes.map((schoolClass) => (
                        <MenuItem key={schoolClass._id} value={schoolClass._id}>
                          {schoolClass.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Student */}
                  <FormControl
                    fullWidth
                    size="small"
                    required
                    disabled={!selectedClass || students.length === 0}
                    sx={fieldSx}
                  >
                    <InputLabel id="student-label">Select Student</InputLabel>

                    <Select
                      labelId="student-label"
                      value={studentId}
                      label="Select Student"
                      onChange={(event) => setStudentId(event.target.value)}
                      MenuProps={menuProps}
                    >
                      {students.map((student) => (
                        <MenuItem key={student._id} value={student._id}>
                          {student.name} ({student.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedClass && students.length === 0 && (
                    <Alert severity="info">
                      No students are currently assigned to this class.
                    </Alert>
                  )}

                  {/* Category */}
                  <FormControl fullWidth size="small" required sx={fieldSx}>
                    <InputLabel id="category-label">Category</InputLabel>

                    <Select
                      labelId="category-label"
                      value={category}
                      label="Category"
                      onChange={(event) => setCategory(event.target.value)}
                      MenuProps={menuProps}
                    >
                      <MenuItem value="academic">Academic</MenuItem>
                      <MenuItem value="attendance">Attendance</MenuItem>
                      <MenuItem value="homework">Homework</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                      <MenuItem value="administrative">Administrative</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Priority - independent of category */}
                  <FormControl
                    fullWidth
                    size="small"
                    required
                    sx={{ ...fieldSx, mt: 1 }}
                  >
                    <InputLabel id="priority-label" shrink>
                      Priority
                    </InputLabel>

                    <Select
                      labelId="priority-label"
                      id="priority"
                      value={priority}
                      label="Priority"
                      onChange={(event) => setPriority(event.target.value)}
                      MenuProps={menuProps}
                    >
                      <MenuItem value="normal">Normal Priority</MenuItem>

                      <MenuItem value="high">High Priority</MenuItem>
                    </Select>

                    <FormHelperText sx={{ ml: 0 }}>
                      Choose priority independently of the conversation
                      category.
                    </FormHelperText>
                  </FormControl>

                  {/* Subject */}
                  <TextField
                    label="Subject"
                    size="small"
                    fullWidth
                    required
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    slotProps={{
                      htmlInput: {
                        maxLength: 150,
                      },
                    }}
                    placeholder="e.g. Attendance Concern"
                    sx={fieldSx}
                  />

                  {/* Message */}
                  <TextField
                    label="Message"
                    fullWidth
                    required
                    multiline
                    minRows={5}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    slotProps={{
                      htmlInput: {
                        maxLength: 5000,
                      },
                    }}
                    placeholder="Write your message to the parent..."
                    sx={fieldSx}
                  />

                  {/* Buttons */}
                  <Stack
                    direction={{
                      xs: "column-reverse",
                      sm: "row",
                    }}
                    justifyContent="flex-end"
                    spacing={1.5}
                    sx={{ pt: 1 }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackRoundedIcon />}
                      onClick={() => navigate("/teacher/conversations")}
                      disabled={sending}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SendRoundedIcon />}
                      disabled={
                        sending ||
                        !selectedClass ||
                        !studentId ||
                        !subject.trim() ||
                        !content.trim()
                      }
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        boxShadow: "none",
                        "&:hover": {
                          boxShadow: "none",
                        },
                      }}
                    >
                      {sending ? "Sending..." : "Start Conversation"}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default TeacherNewConversation;
