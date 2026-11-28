import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";

import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";

function getChildId(item) {
  return String(item?.child?._id || item?.child?.id || "");
}

function getLatestAttempt(submission) {
  if (!submission?.attempts?.length) return null;

  return [...submission.attempts].sort(
    (a, b) => b.attemptNumber - a.attemptNumber,
  )[0];
}

function getDayStart(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getTaskState(task) {
  const status = task.submission?.latestAttempt?.status;

  if (status === "graded") return "graded";
  if (status === "under_review") return "under_review";
  if (status === "submitted") return "submitted";
  if (status === "resubmission_required") return "resubmission_required";

  if (task.status === "completed") return "completed";

  if (!task.dueDate) return "pending";

  const dueDate = getDayStart(task.dueDate);
  const today = getDayStart();

  if (dueDate < today) return "overdue";
  if (dueDate.getTime() === today.getTime()) return "today";

  return "upcoming";
}

function formatDate(value) {
  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "No due date";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAttemptFiles(attempt, submission) {
  const rawFiles =
    attempt?.files ||
    attempt?.attachments ||
    submission?.files ||
    submission?.attachments ||
    [];

  return Array.isArray(rawFiles) ? rawFiles : [];
}

function isPdfFile(file) {
  const name = String(
    file?.originalName || file?.name || file?.fileName || "",
  ).toLowerCase();
  const mime = String(
    file?.mimeType || file?.mimetype || file?.type || "",
  ).toLowerCase();
  return mime.includes("pdf") || name.endsWith(".pdf");
}

function getFileLabel(file, index) {
  return (
    file?.originalName ||
    file?.name ||
    file?.fileName ||
    `Uploaded File ${index + 1}`
  );
}

const statusConfig = {
  overdue: {
    label: "Overdue",
    color: "error",
    description: "The due date has passed.",
  },
  today: {
    label: "Due Today",
    color: "warning",
    description: "This assignment is due today.",
  },
  upcoming: {
    label: "Upcoming",
    color: "info",
    description: "There is still time to complete this assignment.",
  },
  pending: {
    label: "Pending",
    color: "warning",
    description: "This assignment has no due date.",
  },
  completed: {
    label: "Completed",
    color: "success",
    description: "Your child has marked this assignment complete.",
  },
  submitted: {
    label: "Submitted",
    color: "info",
    description: "Your child has submitted this homework.",
  },
  under_review: {
    label: "Under Review",
    color: "info",
    description: "The teacher is reviewing this submission.",
  },
  graded: {
    label: "Graded",
    color: "success",
    description: "The teacher has reviewed and graded this assignment.",
  },
  resubmission_required: {
    label: "Resubmission Required",
    color: "warning",
    description: "The teacher has requested another submission.",
  },
};

function ParentHomework() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const location = useLocation();

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(
    location.state?.selectedChild || "all",
  );
  const [filter, setFilter] = useState(location.state?.filter || "all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewingFileId, setViewingFileId] = useState(null);
  const [fileViewError, setFileViewError] = useState("");

  // Fetch homework and submissions for every linked child
  const fetchChildrenHomework = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/homework/parent");
      const receivedChildren = response.data.children || [];

      const childrenWithSubmissions = await Promise.all(
        receivedChildren.map(async (item) => {
          const childId = getChildId(item);

          if (!childId) return item;

          const submissionResponse = await api.get(
            `/submissions/parent/${childId}`,
          );

          const submissions = Array.isArray(submissionResponse.data)
            ? submissionResponse.data
            : submissionResponse.data.submissions || [];

          const submissionMap = new Map();

          submissions.forEach((submission) => {
            const homeworkId = String(
              submission.homework?._id || submission.homework || "",
            );

            if (!homeworkId) return;

            submissionMap.set(homeworkId, {
              ...submission,
              latestAttempt: getLatestAttempt(submission),
            });
          });

          return {
            ...item,
            homework: (item.homework || []).map((task) => ({
              ...task,
              submission: submissionMap.get(String(task._id)) || null,
            })),
          };
        }),
      );

      setChildren(childrenWithSubmissions);

      if (
        selectedChild !== "all" &&
        !childrenWithSubmissions.some(
          (item) => getChildId(item) === selectedChild,
        )
      ) {
        setSelectedChild("all");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load children's homework and submissions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildrenHomework();
  }, []);

  const allHomework = useMemo(
    () =>
      children.flatMap((item) =>
        (item.homework || []).map((task) => ({
          ...task,
          studentName: item.child?.name || "Unknown",
          studentId: getChildId(item),
          taskState: getTaskState(task),
        })),
      ),
    [children],
  );

  const visibleHomework = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return allHomework
      .filter((task) => {
        const matchesChild =
          selectedChild === "all" || task.studentId === selectedChild;

        const matchesFilter =
          filter === "all" ||
          (filter === "pending" &&
            ["pending", "overdue", "today", "upcoming"].includes(
              task.taskState,
            )) ||
          task.taskState === filter;

        const matchesSearch =
          !searchText ||
          [task.title, task.description, task.studentName]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(searchText));

        return matchesChild && matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        const order = {
          overdue: 0,
          today: 1,
          resubmission_required: 2,
          pending: 3,
          upcoming: 4,
          submitted: 5,
          under_review: 6,
          graded: 7,
          completed: 8,
        };

        if (order[a.taskState] !== order[b.taskState]) {
          return order[a.taskState] - order[b.taskState];
        }

        return (
          new Date(a.dueDate || "9999-12-31") -
          new Date(b.dueDate || "9999-12-31")
        );
      });
  }, [allHomework, selectedChild, filter, search]);

  const stats = useMemo(
    () => ({
      total: allHomework.length,
      pending: allHomework.filter((task) =>
        ["pending", "overdue", "today", "upcoming"].includes(task.taskState),
      ).length,
      submitted: allHomework.filter((task) =>
        ["submitted", "under_review"].includes(task.taskState),
      ).length,
      graded: allHomework.filter((task) => task.taskState === "graded").length,
      overdue: allHomework.filter((task) => task.taskState === "overdue")
        .length,
      resubmission: allHomework.filter(
        (task) => task.taskState === "resubmission_required",
      ).length,
      completed: allHomework.filter((task) => task.taskState === "completed")
        .length,
    }),
    [allHomework],
  );

  const selectedChildName =
    selectedChild === "all"
      ? "All Children"
      : children.find((item) => getChildId(item) === selectedChild)?.child
          ?.name || "Selected Child";

  const filters = [
    { value: "all", label: "All", count: stats.total },
    { value: "pending", label: "Pending", count: stats.pending },
    {
      value: "overdue",
      label: "Overdue",
      count: allHomework.filter((task) => task.taskState === "overdue").length,
    },
    { value: "submitted", label: "Submitted", count: stats.submitted },
    { value: "graded", label: "Graded", count: stats.graded },
    {
      value: "resubmission_required",
      label: "Resubmission",
      count: allHomework.filter(
        (task) => task.taskState === "resubmission_required",
      ).length,
    },
    {
      value: "completed",
      label: "Completed",
      count: allHomework.filter((task) => task.taskState === "completed")
        .length,
    },
  ];

  // Theme-aware summary cards — matches the teacher page blueprint
  const statCards = [
    {
      title: "Total Homework",
      value: stats.total,
      icon: AssignmentOutlinedIcon,
      color: isDark ? "#93C5FD" : "#1976D2",
      background: isDark ? "#1E3553" : "#EAF2FF",
      border: isDark ? "#304D70" : "#C9DCFF",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: AccessTimeOutlinedIcon,
      color: isDark ? "#FBBF65" : "#ED8B00",
      background: isDark ? "#46351F" : "#FFF3DF",
      border: isDark ? "#69502D" : "#FFE0A8",
    },
    {
      title: "Submitted",
      value: stats.submitted,
      icon: CheckCircleOutlineOutlinedIcon,
      color: isDark ? "#86EFAC" : "#2E7D32",
      background: isDark ? "#1E3B2A" : "#E8F5E9",
      border: isDark ? "#315B40" : "#C5E5C8",
    },
    {
      title: "Graded",
      value: stats.graded,
      icon: EventBusyOutlinedIcon,
      color: isDark ? "#C4B5FD" : "#7E57C2",
      background: isDark ? "#352B50" : "#F0EBFA",
      border: isDark ? "#51416F" : "#D9CCF0",
    },
  ];

  // Secure file access through the backend
  const handleViewFile = async (task, file) => {
    const submission = task.submission;
    const attempt = submission?.latestAttempt;

    if (!submission?._id || !attempt?.attemptNumber || !file?._id) {
      setFileViewError("Unable to identify this submission file.");
      return;
    }

    const newWindow = window.open("about:blank", "_blank");

    if (!newWindow) {
      setFileViewError("Please allow pop-ups to view this homework file.");
      return;
    }

    try {
      setViewingFileId(file._id);
      setFileViewError("");

      const response = await api.get(
        `/submissions/${submission._id}/attempt/${attempt.attemptNumber}/file/${file._id}`,
      );

      if (!response.data.url) {
        throw new Error("The server did not return a file URL.");
      }

      newWindow.location.href = response.data.url;
    } catch (err) {
      newWindow.close();

      setFileViewError(
        err.response?.data?.message ||
          err.message ||
          "Unable to open this file.",
      );
    } finally {
      setViewingFileId(null);
    }
  };

  return (
    <DashboardLayout title="Children's Homework">
      <Box sx={{ maxWidth: 1200, mx: "auto", pb: 5 }}>
        {/* Page Heading — mirrors the teacher page blueprint */}
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
              Homework Tracker
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            sx={{ color: "text.secondary", lineHeight: 1.6 }}
          >
            Monitor assignments, deadlines, and your children's progress.
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {fileViewError && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setFileViewError("")}
          >
            {fileViewError}
          </Alert>
        )}

        {loading ? (
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
        ) : children.length === 0 ? (
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
              <SchoolOutlinedIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 1.5 }}
              />

              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                No linked children found
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 1 }}
              >
                Please contact the school administrator to link your account
                with your child.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary metrics — teacher-blueprint stat cards */}
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

            {/* Additional stats chips — mirrors teacher page chip row */}
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5, mb: 4.5 }}>
              <Chip
                label={`Overdue: ${stats.overdue}`}
                color="error"
                variant="outlined"
              />
              <Chip
                label={`Resubmission Required: ${stats.resubmission}`}
                color="warning"
                variant="outlined"
              />
              <Chip
                label={`Completed: ${stats.completed}`}
                color="success"
                variant="outlined"
              />
            </Stack>

            {/* Child selection and search — same structure as before */}
            <Card
              elevation={0}
              sx={{
                mb: 2.5,
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
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <FormControl
                    size="small"
                    sx={{ minWidth: { xs: "100%", sm: 230 } }}
                  >
                    <InputLabel id="homework-child-label">Child</InputLabel>

                    <Select
                      labelId="homework-child-label"
                      value={selectedChild}
                      label="Child"
                      onChange={(event) => setSelectedChild(event.target.value)}
                    >
                      <MenuItem value="all">All Children</MenuItem>

                      {children.map((item) => (
                        <MenuItem
                          key={getChildId(item)}
                          value={getChildId(item)}
                        >
                          {item.child?.name || "Unknown"}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search assignments..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon color="action" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Filters */}
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.25, mb: 3 }}>
              {filters.map((item) => (
                <Chip
                  key={item.value}
                  clickable
                  label={`${item.label} (${item.count})`}
                  onClick={() => setFilter(item.value)}
                  color={filter === item.value ? "primary" : "default"}
                  variant={filter === item.value ? "filled" : "outlined"}
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Stack>

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
                {selectedChildName}
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                {visibleHomework.length} assignment
                {visibleHomework.length === 1 ? "" : "s"} matching your filters.
              </Typography>
            </Box>

            {/* Homework cards */}
            {visibleHomework.length === 0 ? (
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
                    sx={{ fontSize: 48, color: "text.secondary", mb: 1.5 }}
                  />

                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    No assignments found
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mt: 1 }}
                  >
                    Try another status filter or search term.
                  </Typography>

                  <Button
                    size="small"
                    onClick={() => {
                      setFilter("all");
                      setSearch("");
                    }}
                    sx={{
                      mt: 2,
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                    }}
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2.5}>
                {visibleHomework.map((task) => {
                  const status =
                    statusConfig[task.taskState] || statusConfig.pending;

                  const attempt = task.submission?.latestAttempt;
                  const attemptStatusConfig =
                    statusConfig[attempt?.status] || status;
                  const submittedAtValue =
                    attempt?.submittedAt ||
                    attempt?.createdAt ||
                    task.submission?.submittedAt ||
                    task.submission?.updatedAt;
                  const uploadedFiles = getAttemptFiles(
                    attempt,
                    task.submission,
                  );
                  const hasMarks =
                    attempt?.marks !== undefined &&
                    attempt?.marks !== null &&
                    attempt?.marks !== "";
                  const maxMarks =
                    task.maxMarks ?? task.totalMarks ?? task.points ?? null;

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
                        {/* Title + status header */}
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
                            <Stack
                              direction="row"
                              alignItems="center"
                              flexWrap="wrap"
                              gap={1.25}
                              sx={{ mb: 1 }}
                            >
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

                              <Chip
                                size="small"
                                label={status.label}
                                color={status.color}
                                variant="outlined"
                                sx={{ fontWeight: 700, flexShrink: 0 }}
                              />
                            </Stack>

                            <Stack
                              direction="row"
                              alignItems="center"
                              flexWrap="wrap"
                              columnGap={2.5}
                              rowGap={1}
                            >
                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                              >
                                <Avatar
                                  sx={{
                                    width: 23,
                                    height: 23,
                                    bgcolor: "action.selected",
                                    color: "primary.main",
                                  }}
                                >
                                  <SchoolOutlinedIcon sx={{ fontSize: 15 }} />
                                </Avatar>

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {task.studentName}
                                </Typography>
                              </Stack>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Class: {task.schoolClass?.name || "Unknown"}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Teacher: {task.createdBy?.name || "Unknown"}
                              </Typography>
                            </Stack>
                          </Box>

                          <Box
                            sx={{
                              minWidth: { sm: 170 },
                              maxWidth: { sm: 220 },
                              flexShrink: 0,
                              textAlign: { xs: "left", sm: "right" },
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={0.75}
                              alignItems="center"
                              justifyContent={{
                                xs: "flex-start",
                                sm: "flex-end",
                              }}
                            >
                              <CalendarTodayOutlinedIcon
                                sx={{
                                  fontSize: 15,
                                  color:
                                    task.taskState === "overdue"
                                      ? "error.main"
                                      : "text.secondary",
                                }}
                              />

                              <Typography variant="body2" fontWeight={700}>
                                {formatDate(task.dueDate)}
                              </Typography>
                            </Stack>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              mt={0.75}
                            >
                              {status.description}
                            </Typography>
                          </Box>
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
                          {task.description || "No description provided."}
                        </Typography>

                        {/* Teacher evaluation */}
                        {attempt && (
                          <>
                            <Divider sx={{ my: 3 }} />

                            <Box
                              sx={(theme) => ({
                                p: { xs: 2, sm: 2.5 },
                                borderRadius: 3,
                                border: 1,
                                borderColor:
                                  attempt.status === "graded"
                                    ? alpha(theme.palette.success.main, 0.35)
                                    : attempt.status === "resubmission_required"
                                      ? alpha(theme.palette.warning.main, 0.4)
                                      : alpha(theme.palette.info.main, 0.25),
                                bgcolor: (theme) =>
                                  alpha(
                                    theme.palette.common.white,
                                    theme.palette.mode === "dark" ? 0.02 : 0.6,
                                  ),
                                backgroundImage: "none",
                              })}
                            >
                              <Stack spacing={2.25}>
                                {/* Evaluation header */}
                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  alignItems={{
                                    xs: "flex-start",
                                    sm: "center",
                                  }}
                                  justifyContent="space-between"
                                  flexWrap="wrap"
                                  gap={1.25}
                                >
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    flexWrap="wrap"
                                  >
                                    <RateReviewOutlinedIcon
                                      color="primary"
                                      sx={{ fontSize: 20 }}
                                    />
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight={800}
                                    >
                                      Teacher's Evaluation
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={attemptStatusConfig.label}
                                      color={attemptStatusConfig.color}
                                      sx={{ fontWeight: 700 }}
                                    />
                                  </Stack>

                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.75}
                                  >
                                    <ScheduleRoundedIcon
                                      sx={{
                                        fontSize: 15,
                                        color: "text.secondary",
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Submitted:{" "}
                                      <Box
                                        component="span"
                                        sx={{
                                          color: "text.primary",
                                          fontWeight: 700,
                                        }}
                                      >
                                        {formatDateTime(submittedAtValue)}
                                      </Box>
                                    </Typography>
                                  </Stack>
                                </Stack>

                                {/* Marks / Attempt / Submission date grid */}
                                <Grid container spacing={1.5}>
                                  {hasMarks && (
                                    <Grid item xs={12} sm={4}>
                                      <Box
                                        sx={{
                                          p: 2,
                                          borderRadius: 2,
                                          bgcolor: "success.main",
                                          color: "success.contrastText",
                                          height: "100%",
                                          boxShadow: 2,
                                        }}
                                      >
                                        <Stack
                                          direction="row"
                                          alignItems="center"
                                          spacing={0.75}
                                          sx={{ mb: 0.5 }}
                                        >
                                          <EmojiEventsOutlinedIcon
                                            sx={{ fontSize: 20 }}
                                          />
                                          <Typography
                                            variant="caption"
                                            fontWeight={700}
                                            sx={{ letterSpacing: 0.4 }}
                                          >
                                            MARKS AWARDED
                                          </Typography>
                                        </Stack>

                                        <Stack
                                          direction="row"
                                          alignItems="baseline"
                                          spacing={0.75}
                                        >
                                          <Typography
                                            variant="h3"
                                            fontWeight={900}
                                            lineHeight={1.15}
                                          >
                                            {attempt.marks}
                                          </Typography>
                                          {maxMarks !== null &&
                                            maxMarks !== undefined && (
                                              <Typography
                                                variant="body1"
                                                fontWeight={700}
                                                sx={{ opacity: 0.9 }}
                                              >
                                                / {maxMarks}
                                              </Typography>
                                            )}
                                        </Stack>
                                      </Box>
                                    </Grid>
                                  )}

                                  <Grid item xs={6} sm={hasMarks ? 4 : 6}>
                                    <Box
                                      sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: "action.hover",
                                        border: 1,
                                        borderColor: "divider",
                                        height: "100%",
                                      }}
                                    >
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={0.75}
                                        sx={{ mb: 0.5 }}
                                      >
                                        <FormatListNumberedRoundedIcon
                                          sx={{
                                            fontSize: 16,
                                            color: "primary.main",
                                          }}
                                        />
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          fontWeight={700}
                                          sx={{ letterSpacing: 0.4 }}
                                        >
                                          ATTEMPT NUMBER
                                        </Typography>
                                      </Stack>

                                      <Typography
                                        variant="h4"
                                        fontWeight={800}
                                        lineHeight={1.2}
                                        color="text.primary"
                                      >
                                        #
                                        {String(
                                          attempt.attemptNumber ?? 1,
                                        ).padStart(2, "0")}
                                      </Typography>
                                    </Box>
                                  </Grid>

                                  <Grid item xs={6} sm={hasMarks ? 4 : 6}>
                                    <Box
                                      sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: "action.hover",
                                        border: 1,
                                        borderColor: "divider",
                                        height: "100%",
                                      }}
                                    >
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={0.75}
                                        sx={{ mb: 0.5 }}
                                      >
                                        <ScheduleRoundedIcon
                                          sx={{
                                            fontSize: 16,
                                            color: "info.main",
                                          }}
                                        />
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          fontWeight={700}
                                          sx={{ letterSpacing: 0.4 }}
                                        >
                                          SUBMISSION DATE
                                        </Typography>
                                      </Stack>

                                      <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        color="text.primary"
                                        sx={{ mt: 1 }}
                                      >
                                        {formatDateTime(submittedAtValue)}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>

                                {/* Prominent teacher feedback */}
                                {attempt.feedback && (
                                  <Box
                                    sx={{
                                      p: 2,
                                      borderRadius: 2,
                                      borderLeft: 4,
                                      borderColor:
                                        attempt.status ===
                                        "resubmission_required"
                                          ? "warning.main"
                                          : "primary.main",
                                      bgcolor: "action.hover",
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      fontWeight={700}
                                      display="block"
                                      sx={{
                                        letterSpacing: 0.4,
                                        mb: 0.75,
                                      }}
                                    >
                                      TEACHER FEEDBACK
                                    </Typography>

                                    <Typography
                                      variant="body2"
                                      color="text.primary"
                                      sx={{
                                        whiteSpace: "pre-wrap",
                                        lineHeight: 1.65,
                                      }}
                                    >
                                      {attempt.feedback}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Uploaded files with View button */}
                                {uploadedFiles.length > 0 && (
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      fontWeight={700}
                                      display="block"
                                      sx={{
                                        letterSpacing: 0.4,
                                        mb: 1,
                                      }}
                                    >
                                      UPLOADED FILES ({uploadedFiles.length})
                                    </Typography>

                                    <Stack spacing={1}>
                                      {uploadedFiles.map((file, idx) => {
                                        const fileKey =
                                          file?._id || file?.id || idx;
                                        const isLoadingFile =
                                          viewingFileId === file?._id;
                                        const pdf = isPdfFile(file);

                                        return (
                                          <Box
                                            key={fileKey}
                                            sx={{
                                              px: 1.75,
                                              py: 1.25,
                                              borderRadius: 1.75,
                                              bgcolor: "action.hover",
                                              border: 1,
                                              borderColor: "divider",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                              gap: 1.5,
                                            }}
                                          >
                                            <Stack
                                              direction="row"
                                              alignItems="center"
                                              spacing={1.25}
                                              sx={{ minWidth: 0, flex: 1 }}
                                            >
                                              {pdf ? (
                                                <PictureAsPdfOutlinedIcon
                                                  color="error"
                                                  sx={{
                                                    fontSize: 20,
                                                    flexShrink: 0,
                                                  }}
                                                />
                                              ) : (
                                                <InsertDriveFileOutlinedIcon
                                                  color="primary"
                                                  sx={{
                                                    fontSize: 20,
                                                    flexShrink: 0,
                                                  }}
                                                />
                                              )}

                                              <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                color="text.primary"
                                                noWrap
                                                title={getFileLabel(file, idx)}
                                              >
                                                {getFileLabel(file, idx)}
                                              </Typography>
                                            </Stack>

                                            <Button
                                              size="small"
                                              variant="outlined"
                                              startIcon={
                                                isLoadingFile ? (
                                                  <CircularProgress size={14} />
                                                ) : (
                                                  <VisibilityOutlinedIcon
                                                    sx={{ fontSize: 16 }}
                                                  />
                                                )
                                              }
                                              disabled={isLoadingFile}
                                              onClick={() =>
                                                handleViewFile(task, file)
                                              }
                                              sx={{
                                                textTransform: "none",
                                                fontWeight: 700,
                                                flexShrink: 0,
                                              }}
                                            >
                                              {isLoadingFile
                                                ? "Opening..."
                                                : "View"}
                                            </Button>
                                          </Box>
                                        );
                                      })}
                                    </Stack>
                                  </Box>
                                )}
                              </Stack>
                            </Box>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default ParentHomework;
