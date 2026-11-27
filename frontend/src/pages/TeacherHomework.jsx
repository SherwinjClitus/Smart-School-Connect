import { useEffect, useMemo, useState } from "react";

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

import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";

function TeacherHomework() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

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

  const homeworkStats = useMemo(() => {
    const now = new Date();

    let upcoming = 0;
    let overdue = 0;
    let completed = 0;

    homework.forEach((task) => {
      const deadline = new Date(task.dueDate);

      const completedCount = Array.isArray(task.completedBy)
        ? task.completedBy.length
        : 0;

      const schoolClass = task.schoolClass;

      const totalStudents = Array.isArray(schoolClass?.students)
        ? schoolClass.students.length
        : classes.find(
            (item) =>
              String(item._id) === String(schoolClass?._id || schoolClass?.id),
          )?.students?.length || 0;

      const isFullyCompleted =
        totalStudents > 0 && completedCount >= totalStudents;

      if (isFullyCompleted) {
        completed++;
      } else if (deadline < now) {
        overdue++;
      } else {
        upcoming++;
      }
    });

    return {
      total: homework.length,
      upcoming,
      overdue,
      completed,
    };
  }, [homework, classes]);

  const getTaskStatus = (task) => {
    const deadline = new Date(task.dueDate);

    const completedCount = Array.isArray(task.completedBy)
      ? task.completedBy.length
      : 0;

    const schoolClass = task.schoolClass;

    const totalStudents = Array.isArray(schoolClass?.students)
      ? schoolClass.students.length
      : classes.find(
          (item) =>
            String(item._id) === String(schoolClass?._id || schoolClass?.id),
        )?.students?.length || 0;

    if (totalStudents > 0 && completedCount >= totalStudents) {
      return { label: "Completed", color: "success" };
    }

    if (deadline < new Date()) {
      return { label: "Overdue", color: "error" };
    }

    return { label: "Upcoming", color: "info" };
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
      title: "Upcoming",
      value: homeworkStats.upcoming,
      icon: AccessTimeOutlinedIcon,
      color: isDark ? "#FBBF65" : "#ED8B00",
      background: isDark ? "#46351F" : "#FFF3DF",
      border: isDark ? "#69502D" : "#FFE0A8",
    },
    {
      title: "Overdue",
      value: homeworkStats.overdue,
      icon: EventBusyOutlinedIcon,
      color: isDark ? "#FCA5A5" : "#D32F2F",
      background: isDark ? "#472B36" : "#FDECEC",
      border: isDark ? "#68404D" : "#F5CACA",
    },
    {
      title: "Completed",
      value: homeworkStats.completed,
      icon: CheckCircleOutlineOutlinedIcon,
      color: isDark ? "#86EFAC" : "#2E7D32",
      background: isDark ? "#1E3B2A" : "#E8F5E9",
      border: isDark ? "#315B40" : "#C5E5C8",
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
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Page Heading */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2.5,
                bgcolor: isDark ? "#1E3553" : "#EAF2FF",
                color: isDark ? "#93C5FD" : "#1976D2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MenuBookOutlinedIcon fontSize="large" />
            </Box>

            <Typography
              variant="h4"
              fontWeight={800}
              color="text.primary"
              letterSpacing="-0.6px"
            >
              Homework Management
            </Typography>
          </Stack>

          <Typography color="text.secondary">
            Create assignments, manage deadlines, and track student progress.
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
            mb: 4,
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
                <CardContent sx={{ p: 2.5 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{
                      color: isDark ? "#CBD5E1" : "#64748B",
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{
                      color: isDark ? "#F1F5F9" : "#263B53",
                    }}
                    mt={2}
                  >
                    {item.value}
                  </Typography>

                  <Box
                    sx={{
                      position: "absolute",
                      top: 20,
                      right: 20,
                      width: 50,
                      height: 50,
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
                    <Icon sx={{ fontSize: 27 }} />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Create Homework */}
        <Card
          elevation={0}
          sx={{
            mb: 4,
            border: 1,
            borderColor: "divider",
            borderRadius: 3,
            bgcolor: "background.paper",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
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

              <Typography variant="h6" fontWeight={700}>
                Create Homework
              </Typography>
            </Stack>

            <Typography color="text.secondary" variant="body2" mb={3}>
              Assign a new task to one of your classes.
            </Typography>

            <Box component="form" onSubmit={handleCreateHomework}>
              <Stack spacing={2.5}>
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
                    gap: 2,
                  }}
                >
                  {/* Select Class */}
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="text.primary"
                      mb={1}
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
                                <Typography color="text.secondary">
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
                      fontWeight={600}
                      color="text.primary"
                      mb={1}
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
                    size="large"
                    startIcon={<AddTaskOutlinedIcon />}
                    disabled={saving || classes.length === 0}
                    sx={{
                      px: 3,
                      py: 1.2,
                      borderRadius: 2.5,
                      textTransform: "none",
                      fontWeight: 700,
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
        <Box mb={2}>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            Assigned Homework
          </Typography>

          <Typography color="text.secondary" variant="body2" mt={0.5}>
            View and monitor the assignments you've given to your classes.
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
            <CardContent sx={{ py: 6, textAlign: "center" }}>
              <AssignmentOutlinedIcon
                sx={{
                  fontSize: 48,
                  color: "text.secondary",
                  mb: 1,
                }}
              />

              <Typography fontWeight={700} variant="h6">
                No homework assigned yet
              </Typography>

              <Typography color="text.secondary" variant="body2" mt={1}>
                Create your first homework assignment using the form above.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {homework.map((task) => {
              const status = getTaskStatus(task);

              const completedCount = Array.isArray(task.completedBy)
                ? task.completedBy.length
                : 0;

              const schoolClass = task.schoolClass;

              const totalStudents = Array.isArray(schoolClass?.students)
                ? schoolClass.students.length
                : classes.find(
                    (item) =>
                      String(item._id) ===
                      String(schoolClass?._id || schoolClass?.id),
                  )?.students?.length || 0;

              const hasProgress =
                Array.isArray(task.completedBy) && totalStudents > 0;

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
                  <CardContent sx={{ p: 3 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      gap={2}
                      mb={2}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="text.primary"
                        >
                          {task.title}
                        </Typography>

                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.8}
                          mt={1}
                        >
                          <SchoolOutlinedIcon
                            sx={{
                              fontSize: 18,
                              color: "primary.main",
                            }}
                          />

                          <Typography variant="body2" color="text.secondary">
                            {schoolClass?.name || "Unknown class"}
                          </Typography>
                        </Stack>
                      </Box>

                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>

                    <Typography
                      color="text.secondary"
                      sx={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.7,
                        mb: 2,
                      }}
                    >
                      {task.description}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      gap={1.5}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTimeOutlinedIcon
                          sx={{
                            color: "text.secondary",
                            fontSize: 19,
                          }}
                        />

                        <Typography variant="body2" color="text.secondary">
                          Due: {new Date(task.dueDate).toLocaleString()}
                        </Typography>
                      </Stack>

                      {hasProgress ? (
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="primary.main"
                        >
                          {completedCount} / {totalStudents} students completed
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Completion progress unavailable
                        </Typography>
                      )}
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
