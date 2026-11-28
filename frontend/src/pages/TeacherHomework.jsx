import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";

function TeacherHomework() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [homework, setHomework] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [classId, setClassId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [classResponse, homeworkResponse] = await Promise.all([
        api.get("/classes/my-classes"),
        api.get("/homework/teacher"),
      ]);

      setClasses(classResponse.data.classes || []);
      setHomework(homeworkResponse.data.homework || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load homework data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateHomework(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim() || !description.trim() || !dueDate || !classId) {
      setError("Please fill in all fields.");
      return;
    }

    const selectedDueDate = new Date(dueDate);

    if (Number.isNaN(selectedDueDate.getTime())) {
      setError("Please enter a valid due date.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/homework", {
        title: title.trim(),
        description: description.trim(),
        dueDate: selectedDueDate.toISOString(),
        classId,
      });

      setTitle("");
      setDescription("");
      setDueDate("");
      setClassId("");

      setSuccess("Homework created and assigned successfully.");

      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create homework.");
    } finally {
      setSaving(false);
    }
  }

  // Calculate overall submission statistics
  const homeworkStats = useMemo(() => {
    const stats = {
      total: homework.length,
      submitted: 0,
      pending: 0,
      underReview: 0,
      graded: 0,
      resubmissionRequired: 0,
    };

    homework.forEach((task) => {
      const submissionStats = task.submissionStats || {};

      stats.submitted += submissionStats.submitted || 0;
      stats.pending += submissionStats.pending || 0;
      stats.underReview += submissionStats.underReview || 0;
      stats.graded += submissionStats.graded || 0;
      stats.resubmissionRequired += submissionStats.resubmissionRequired || 0;
    });

    return stats;
  }, [homework]);

  // Determine assignment status using real submission data
  const getTaskStatus = (task) => {
    const stats = task.submissionStats || {};

    if (stats.totalStudents > 0 && stats.pending === 0) {
      return {
        label: "All Submitted",
        color: "success",
      };
    }

    if (new Date(task.dueDate) < new Date()) {
      return {
        label: "Overdue",
        color: "error",
      };
    }

    return {
      label: "Awaiting Submissions",
      color: "info",
    };
  };

  // Theme-aware statistic cards
  const statCards = [
    {
      title: "Total Homework",
      value: homeworkStats.total,
      icon: AssignmentOutlinedIcon,
      color: isDark ? "#93C5FD" : "#1976D2",
      background: isDark ? "#1E3553" : "#EAF2FF",
      border: isDark ? "#304D70" : "#C9DCFF",
    },
    {
      title: "Submitted",
      value: homeworkStats.submitted,
      icon: CheckCircleOutlineOutlinedIcon,
      color: isDark ? "#86EFAC" : "#2E7D32",
      background: isDark ? "#1E3B2A" : "#E8F5E9",
      border: isDark ? "#315B40" : "#C5E5C8",
    },
    {
      title: "Pending",
      value: homeworkStats.pending,
      icon: AccessTimeOutlinedIcon,
      color: isDark ? "#FBBF65" : "#ED8B00",
      background: isDark ? "#46351F" : "#FFF3DF",
      border: isDark ? "#69502D" : "#FFE0A8",
    },
    {
      title: "Under Review",
      value: homeworkStats.underReview,
      icon: EventBusyOutlinedIcon,
      color: isDark ? "#C4B5FD" : "#7E57C2",
      background: isDark ? "#352B50" : "#F0EBFA",
      border: isDark ? "#51416F" : "#D9CCF0",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Homework Management">
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
    <DashboardLayout title="Homework Management">
      <Box sx={{ maxWidth: 1200, mx: "auto", pb: 5 }}>
        {/* Page Heading */}
        <Box sx={{ mb: 4 }}>
          <Stack
            direction="row"
            sx={{ alignItems: "center", gap: 1.5, mb: 1.25 }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                flexShrink: 0,
                borderRadius: 2.5,
                bgcolor: isDark ? "#1E3553" : "#EAF2FF",
                color: isDark ? "#93C5FD" : "#1976D2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MenuBookOutlinedIcon fontSize="medium" />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "text.primary",
                letterSpacing: "-0.6px",
                lineHeight: 1.2,
                fontSize: { xs: "1.5rem", sm: "2rem" },
              }}
            >
              Homework Management
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            sx={{ color: "text.secondary", lineHeight: 1.6 }}
          >
            Create assignments, manage deadlines, and track student submissions.
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        {/* Statistics */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2.5,
            mb: 3,
          }}
        >
          {statCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                elevation={0}
                sx={{
                  position: "relative",
                  minHeight: 135,
                  bgcolor: item.background,
                  border: `1px solid ${item.border}`,
                  borderRadius: 3,
                  transition: "0.2s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: isDark
                      ? "0 8px 20px rgba(0,0,0,0.2)"
                      : "0 8px 20px rgba(25,118,210,0.08)",
                  },
                }}
              >
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      pr: 8,
                      color: isDark ? "#CBD5E1" : "#64748B",
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      mt: 2,
                      lineHeight: 1.2,
                      fontSize: { xs: "2rem", sm: "2.25rem" },
                      color: isDark ? "#F1F5F9" : "#263B53",
                    }}
                  >
                    {item.value}
                  </Typography>

                  <Box
                    sx={{
                      position: "absolute",
                      top: 20,
                      right: 20,
                      width: 48,
                      height: 48,
                      bgcolor: isDark ? "#263447" : "#FFFFFF",
                      color: item.color,
                      borderRadius: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isDark
                        ? "0 3px 10px rgba(0,0,0,0.18)"
                        : "0 3px 10px rgba(15,23,42,0.06)",
                    }}
                  >
                    <Icon sx={{ fontSize: 26 }} />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Additional Review Statistics */}
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5, mb: 4.5 }}>
          <Chip
            label={`Graded: ${homeworkStats.graded}`}
            color="success"
            variant="outlined"
          />

          <Chip
            label={`Resubmission Required: ${homeworkStats.resubmissionRequired}`}
            color="warning"
            variant="outlined"
          />
        </Stack>

        {/* Create Homework */}
        <Card
          elevation={0}
          sx={{
            mb: 5,
            border: 1,
            borderColor: "divider",
            borderRadius: 3,
            bgcolor: "background.paper",
          }}
        >
          <CardContent
            sx={{
              p: { xs: 2.5, md: 3.5 },
              "&:last-child": { pb: { xs: 2.5, md: 3.5 } },
            }}
          >
            <Stack
              direction="row"
              sx={{ alignItems: "center", gap: 1.5, mb: 1 }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  borderRadius: 2.5,
                  bgcolor: isDark ? "#1E3553" : "#E1EDFF",
                  color: isDark ? "#93C5FD" : "#1976D2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AddTaskOutlinedIcon />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Create Homework
              </Typography>
            </Stack>

            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mb: 3.5 }}
            >
              Assign a new task to one of your classes.
            </Typography>

            <Box component="form" onSubmit={handleCreateHomework}>
              <Stack spacing={3}>
                <TextField
                  label="Homework Title"
                  placeholder="e.g. Mathematics - Fractions"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  required
                  inputProps={{ maxLength: 150 }}
                />

                <TextField
                  label="Description"
                  placeholder="Explain the homework instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  minRows={4}
                  fullWidth
                  required
                  inputProps={{ maxLength: 5000 }}
                  helperText={`${description.length}/5000 characters`}
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "1fr 1fr",
                    },
                    gap: 2.5,
                  }}
                >
                  {/* Select Class */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        mb: 1,
                      }}
                    >
                      Select Class
                    </Typography>

                    <TextField
                      select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      fullWidth
                      required
                      disabled={classes.length === 0}
                      slotProps={{
                        select: {
                          displayEmpty: true,
                          renderValue: (selected) => {
                            if (!selected) {
                              return (
                                <Typography sx={{ color: "text.secondary" }}>
                                  Select a class
                                </Typography>
                              );
                            }

                            const selectedClass = classes.find(
                              (schoolClass) => schoolClass._id === selected,
                            );

                            return selectedClass?.name || "Select a class";
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
                  </Box>

                  {/* Due Date */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        mb: 1,
                      }}
                    >
                      Due Date & Time
                    </Typography>

                    <TextField
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      fullWidth
                      required
                      slotProps={{
                        htmlInput: {
                          min: new Date().toISOString().slice(0, 16),
                        },
                      }}
                    />
                  </Box>
                </Box>

                {classes.length === 0 && (
                  <Alert severity="info">
                    You need an assigned class before creating homework.
                  </Alert>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<AddTaskOutlinedIcon />}
                    disabled={saving || classes.length === 0}
                    sx={{
                      px: 3,
                      minHeight: 44,
                      borderRadius: 2.5,
                      textTransform: "none",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      width: { xs: "100%", sm: "auto" },
                    }}
                  >
                    {saving ? "Creating..." : "Create Homework"}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Assigned Homework */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              lineHeight: 1.3,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            Assigned Homework
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            View assignments and monitor actual student submissions.
          </Typography>
        </Box>

        {homework.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              border: 1,
              borderStyle: "dashed",
              borderColor: "divider",
              borderRadius: 3,
              bgcolor: "background.paper",
            }}
          >
            <CardContent
              sx={{
                py: 7,
                px: 2,
                textAlign: "center",
                "&:last-child": { pb: 7 },
              }}
            >
              <AssignmentOutlinedIcon
                sx={{
                  fontSize: 48,
                  color: "text.secondary",
                  mb: 1.5,
                }}
              />

              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                No homework assigned yet
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 1 }}
              >
                Create your first homework assignment using the form above.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2.5}>
            {homework.map((task) => {
              const status = getTaskStatus(task);
              const schoolClass = task.schoolClass;
              const stats = task.submissionStats || {};

              const totalStudents = stats.totalStudents || 0;
              const submitted = stats.submitted || 0;
              const pending = stats.pending || 0;
              const underReview = stats.underReview || 0;
              const graded = stats.graded || 0;
              const resubmissionRequired = stats.resubmissionRequired || 0;

              const progress =
                totalStudents > 0
                  ? Math.round((submitted / totalStudents) * 100)
                  : 0;

              return (
                <Card
                  key={task._id}
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 3,
                    bgcolor: "background.paper",
                    transition: "0.2s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: isDark
                        ? "0 6px 18px rgba(0,0,0,0.2)"
                        : "0 6px 18px rgba(25,118,210,0.06)",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: { xs: 2.5, sm: 3.5 },
                      "&:last-child": { pb: { xs: 2.5, sm: 3.5 } },
                    }}
                  >
                    {/* Title and status */}
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      sx={{
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: 2,
                        mb: 2.5,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "text.primary",
                            fontSize: "1.1rem",
                            lineHeight: 1.4,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {task.title}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center", mt: 1 }}
                        >
                          <SchoolOutlinedIcon
                            sx={{
                              fontSize: 18,
                              color: "primary.main",
                            }}
                          />

                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                          >
                            {schoolClass?.name || "Unknown class"}
                          </Typography>
                        </Stack>
                      </Box>

                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 700, flexShrink: 0 }}
                      />
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        lineHeight: 1.7,
                      }}
                    >
                      {task.description}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    {/* Due date and progress */}
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      sx={{
                        justifyContent: "space-between",
                        alignItems: { xs: "stretch", md: "flex-start" },
                        gap: 3,
                      }}
                    >
                      {/* Due date */}
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <AccessTimeOutlinedIcon
                          sx={{
                            color: "text.secondary",
                            fontSize: 19,
                          }}
                        />

                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          Due: {new Date(task.dueDate).toLocaleString()}
                        </Typography>
                      </Stack>

                      {/* Submission progress */}
                      <Box
                        sx={{
                          width: { xs: "100%", md: 340 },
                          flexShrink: 0,
                        }}
                      >
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 2,
                            mb: 1.25,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Submission Progress
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{ color: "primary.main", fontWeight: 700 }}
                          >
                            {submitted}/{totalStudents}
                          </Typography>
                        </Stack>

                        <Box
                          sx={{
                            height: 8,
                            bgcolor: "action.hover",
                            borderRadius: 5,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              width: `${progress}%`,
                              height: "100%",
                              bgcolor: "success.main",
                              borderRadius: 5,
                              transition: "width 300ms ease",
                            }}
                          />
                        </Box>

                        <Stack
                          direction="row"
                          sx={{
                            flexWrap: "wrap",
                            columnGap: 2,
                            rowGap: 0.75,
                            mt: 1.75,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ color: "success.main" }}
                          >
                            Submitted: {submitted}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{ color: "warning.main" }}
                          >
                            Pending: {pending}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            Under review: {underReview}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            Graded: {graded}
                          </Typography>

                          {resubmissionRequired > 0 && (
                            <Typography
                              variant="caption"
                              sx={{ color: "error.main" }}
                            >
                              Corrections: {resubmissionRequired}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Stack>

                    <Divider sx={{ my: 3 }} />

                    {/* View submissions */}
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      sx={{
                        justifyContent: "flex-end",
                        alignItems: { xs: "stretch", sm: "center" },
                        gap: 1.5,
                      }}
                    >
                      <Button
                        variant="contained"
                        startIcon={<VisibilityOutlinedIcon />}
                        onClick={() =>
                          navigate(`/teacher/homework/${task._id}/submissions`)
                        }
                        sx={{
                          minHeight: 40,
                          px: 2.5,
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: 2,
                          whiteSpace: "nowrap",
                        }}
                      >
                        View Student Submissions
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default TeacherHomework;
