import { useEffect, useMemo, useRef, useState } from "react";

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
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";

import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

function getDayStart(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getTaskState(task) {
  if (task.submissionStatus === "graded") return "completed";

  if (task.submissionStatus === "resubmission_required") {
    return "resubmission";
  }

  if (
    task.submissionStatus === "submitted" ||
    task.submissionStatus === "under_review"
  ) {
    return "submitted";
  }

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

  return date.toLocaleDateString(undefined, {
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

const statusConfig = {
  overdue: {
    label: "Overdue",
    color: "error",
    description: "The due date has passed. You can still submit your homework.",
  },
  today: {
    label: "Due Today",
    color: "warning",
    description: "Try to submit this assignment today.",
  },
  upcoming: {
    label: "Upcoming",
    color: "info",
    description: "You still have time to complete this assignment.",
  },
  pending: {
    label: "Pending",
    color: "warning",
    description: "Upload your completed homework to submit this assignment.",
  },
  submitted: {
    label: "Submitted",
    color: "info",
    description: "Your homework has been submitted and is awaiting review.",
  },
  under_review: {
    label: "Under Review",
    color: "info",
    description: "Your teacher is currently reviewing your homework.",
  },
  completed: {
    label: "Graded",
    color: "success",
    description: "Your teacher has reviewed and graded this assignment.",
  },
  resubmission: {
    label: "Corrections Required",
    color: "warning",
    description:
      "Your teacher has requested corrections. Please submit a new attempt.",
  },
};

const sectionCardSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: 2.5,
  bgcolor: "background.paper",
  backgroundImage: "none",
  boxShadow: "none",
};

function StudentHomework() {
  const [homework, setHomework] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedHomework, setSelectedHomework] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [viewingFileId, setViewingFileId] = useState(null);
  const [fileViewError, setFileViewError] = useState("");

  const fileInputRef = useRef(null);

  async function fetchHomework() {
    try {
      setLoading(true);
      setError("");

      const [homeworkResponse, submissionsResponse] = await Promise.all([
        api.get("/homework/student"),
        api.get("/submissions/student"),
      ]);

      const assignments = homeworkResponse.data.homework || [];
      const submissions = submissionsResponse.data.submissions || [];

      // Match actual submissions with their homework assignments.
      const submissionMap = new Map();

      submissions.forEach((submission) => {
        const homeworkId =
          typeof submission.homework === "object"
            ? submission.homework?._id
            : submission.homework;

        if (!homeworkId) return;

        const attempts = submission.attempts || [];
        const latestAttempt = attempts[attempts.length - 1] || null;

        submissionMap.set(String(homeworkId), {
          ...submission,
          latestAttempt,
        });
      });

      const updatedAssignments = assignments.map((task) => {
        const submission = submissionMap.get(String(task._id)) || null;

        return {
          ...task,
          submission,
          latestAttempt: submission?.latestAttempt || null,
          submissionStatus: submission?.latestAttempt?.status || "pending",
        };
      });

      setHomework(updatedAssignments);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load homework and submission information.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHomework();
  }, []);

  const tasks = useMemo(
    () =>
      homework.map((task) => ({
        ...task,
        taskState: getTaskState(task),
      })),
    [homework],
  );

  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter(
        (task) =>
          task.taskState !== "completed" &&
          task.taskState !== "submitted" &&
          task.taskState !== "under_review",
      ).length,
      overdue: tasks.filter((task) => task.taskState === "overdue").length,
      today: tasks.filter((task) => task.taskState === "today").length,
      completed: tasks.filter((task) => task.taskState === "completed").length,
      submitted: tasks.filter(
        (task) =>
          task.taskState === "submitted" || task.taskState === "under_review",
      ).length,
      resubmission: tasks.filter((task) => task.taskState === "resubmission")
        .length,
    }),
    [tasks],
  );

  const filters = [
    { value: "all", label: "All", count: stats.total },
    { value: "pending", label: "Pending", count: stats.pending },
    { value: "overdue", label: "Overdue", count: stats.overdue },
    { value: "today", label: "Due Today", count: stats.today },
    { value: "submitted", label: "Submitted", count: stats.submitted },
    {
      value: "resubmission",
      label: "Corrections",
      count: stats.resubmission,
    },
    { value: "completed", label: "Graded", count: stats.completed },
  ];

  const filteredHomework = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const matchesFilter =
          filter === "all" ||
          (filter === "submitted" &&
            ["submitted", "under_review"].includes(task.taskState)) ||
          task.taskState === filter;

        const matchesSearch =
          !searchText ||
          [task.title, task.description, task.schoolClass?.name]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(searchText));

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        const order = {
          resubmission: 0,
          overdue: 1,
          today: 2,
          upcoming: 3,
          pending: 4,
          submitted: 5,
          under_review: 6,
          completed: 7,
        };

        if (order[a.taskState] !== order[b.taskState]) {
          return order[a.taskState] - order[b.taskState];
        }

        return (
          new Date(a.dueDate || "9999-12-31") -
          new Date(b.dueDate || "9999-12-31")
        );
      });
  }, [tasks, filter, search]);

  const progress = stats.total
    ? Math.round(((stats.completed + stats.submitted) / stats.total) * 100)
    : 0;

  function openSubmissionDialog(task) {
    setSelectedHomework(task);
    setSelectedFiles([]);
    setUploadError("");
  }

  function closeSubmissionDialog() {
    if (uploading) return;

    setSelectedFiles([]);
    setSelectedHomework(null);
    setUploadError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelection(event) {
    const incomingFiles = Array.from(event.target.files || []);

    setUploadError("");

    if (selectedFiles.length + incomingFiles.length > MAX_FILES) {
      setUploadError(`You can upload a maximum of ${MAX_FILES} files.`);
      event.target.value = "";
      return;
    }

    const validFiles = [];

    for (const file of incomingFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(
          `${file.name} is not supported. Upload JPG, PNG, or PDF files only.`,
        );
        break;
      }

      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`${file.name} exceeds the 10 MB file size limit.`);
        break;
      }

      validFiles.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      });
    }

    if (validFiles.length > 0 && !event.target.value) {
      setSelectedFiles((previous) => [...previous, ...validFiles]);
    } else if (validFiles.length > 0) {
      setSelectedFiles((previous) => [...previous, ...validFiles]);
    }

    event.target.value = "";
  }

  function removeSelectedFile(fileId) {
    setSelectedFiles((previous) => {
      const removedFile = previous.find((item) => item.id === fileId);

      if (removedFile?.previewUrl) {
        URL.revokeObjectURL(removedFile.previewUrl);
      }

      return previous.filter((item) => item.id !== fileId);
    });
  }

  async function handleSubmitHomework() {
    if (!selectedHomework) return;

    if (selectedFiles.length === 0) {
      setUploadError("Please select at least one photo or PDF.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const formData = new FormData();

      selectedFiles.forEach((item) => {
        formData.append("files", item.file);
      });

      await api.post(`/submissions/${selectedHomework._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      selectedFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      setSelectedFiles([]);
      setSelectedHomework(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchHomework();
    } catch (err) {
      setUploadError(
        err.response?.data?.message ||
          "Unable to submit homework. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }
  async function handleViewFile(submission, attempt, file) {
    const fileId = file._id;

    if (!submission?._id || !attempt?.attemptNumber || !fileId) {
      setFileViewError("Unable to identify this submission file.");
      return;
    }

    // Open a blank tab immediately to avoid browser popup blocking.
    const newWindow = window.open("about:blank", "_blank");

    if (!newWindow) {
      setFileViewError("Please allow pop-ups to view your homework file.");
      return;
    }

    try {
      setViewingFileId(fileId);
      setFileViewError("");

      const response = await api.get(
        `/submissions/${submission._id}/attempt/${attempt.attemptNumber}/file/${fileId}`,
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
  }

  function renderSubmissionFiles(submission, attempt, files) {
    if (!files?.length) return null;

    return (
      <Stack spacing={1} sx={{ mt: 1 }}>
        {files.map((file, index) => (
          <Stack
            key={file._id || `${file.publicId}-${index}`}
            direction="row"
            spacing={1}
            alignItems="center"
          >
            {file.format === "pdf" ? (
              <PictureAsPdfOutlinedIcon color="error" />
            ) : (
              <ImageOutlinedIcon color="primary" />
            )}

            <Typography
              variant="body2"
              sx={{ flex: 1, overflowWrap: "anywhere" }}
            >
              {file.originalName}
            </Typography>

            <Button
              size="small"
              startIcon={<VisibilityOutlined />}
              disabled={viewingFileId === file._id}
              onClick={() => handleViewFile(submission, attempt, file)}
            >
              {viewingFileId === file._id ? "Opening..." : "View"}
            </Button>
          </Stack>
        ))}
      </Stack>
    );
  }

  return (
    <DashboardLayout title="My Homework">
      <Box sx={{ maxWidth: 1100, mx: "auto", pb: 5 }}>
        {/* Heading */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2.5,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "text.primary",
                lineHeight: 1.3,
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              My Homework
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5, lineHeight: 1.5 }}
            >
              Complete your assignments and submit photos or PDF documents.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchHomework}
            disabled={loading || uploading}
            sx={{
              textTransform: "none",
              flexShrink: 0,
              minHeight: 38,
              alignSelf: { xs: "flex-start", sm: "center" },
            }}
          >
            Refresh
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "45vh",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Progress summary */}
            <Card elevation={0} sx={{ ...sectionCardSx, mb: 3.5 }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, lineHeight: 1.4 }}>
                      Assignment Progress
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mt: 0.25 }}
                    >
                      {stats.completed} graded and {stats.submitted} submitted
                      out of {stats.total} assignments
                    </Typography>
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: "success.main",
                      flexShrink: 0,
                    }}
                  >
                    {progress}%
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    height: 9,
                    bgcolor: "action.selected",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${progress}%`,
                      bgcolor: "success.main",
                      borderRadius: 10,
                      transition: "width 0.3s ease",
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Search */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search by assignment or class..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ mb: 2.5 }}
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

            {/* Filters */}
            <Box
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                mb: 3,
              }}
            >
              <Tabs
                value={filter}
                onChange={(event, newValue) => setFilter(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 700,
                    minHeight: 48,
                  },
                }}
              >
                {filters.map((item) => (
                  <Tab
                    key={item.value}
                    value={item.value}
                    label={`${item.label} (${item.count})`}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Assignment count */}
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <Typography sx={{ fontWeight: 800, color: "text.primary" }}>
                Assignments
              </Typography>

              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {filteredHomework.length} shown
              </Typography>
            </Stack>

            {/* Empty state */}
            {filteredHomework.length === 0 ? (
              <Card
                elevation={0}
                sx={{
                  border: 1,
                  borderStyle: "dashed",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  bgcolor: "background.paper",
                  textAlign: "center",
                  py: 6,
                  px: 2,
                }}
              >
                <AssignmentOutlinedIcon
                  sx={{ fontSize: 42, color: "text.disabled", mb: 1 }}
                />

                <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                  No assignments found
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.5 }}
                >
                  Try another filter or search term.
                </Typography>

                <Button
                  size="small"
                  onClick={() => {
                    setFilter("all");
                    setSearch("");
                  }}
                  sx={{ mt: 2, textTransform: "none", minHeight: 34 }}
                >
                  Clear filters
                </Button>
              </Card>
            ) : (
              <Stack spacing={2}>
                {filteredHomework.map((task) => {
                  const status =
                    statusConfig[task.taskState] || statusConfig.pending;

                  const latestAttempt = task.latestAttempt;

                  const canSubmit =
                    !latestAttempt ||
                    latestAttempt.status === "resubmission_required";

                  return (
                    <Card
                      key={task._id}
                      elevation={0}
                      sx={{
                        ...sectionCardSx,
                        mb: 0,
                        transition: "border-color 0.2s",
                        "&:hover": {
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 2.5,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
                            <Stack
                              direction="row"
                              sx={{
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 1.25,
                                mb: 1.25,
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 800,
                                  color: "text.primary",
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
                                sx={{ fontWeight: 700 }}
                              />
                            </Stack>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                lineHeight: 1.6,
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {task.description || "No description provided."}
                            </Typography>

                            <Stack
                              direction="row"
                              sx={{
                                flexWrap: "wrap",
                                columnGap: 2.5,
                                rowGap: 1,
                                mt: 2,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                Class: {task.schoolClass?.name || "Unknown"}
                              </Typography>

                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                Teacher: {task.createdBy?.name || "Unknown"}
                              </Typography>
                            </Stack>
                          </Box>

                          <Box
                            sx={{
                              minWidth: { sm: 190 },
                              flexShrink: 0,
                              textAlign: { xs: "left", sm: "right" },
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={0.75}
                              sx={{
                                alignItems: "center",
                                justifyContent: {
                                  xs: "flex-start",
                                  sm: "flex-end",
                                },
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

                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color:
                                    task.taskState === "overdue"
                                      ? "error.main"
                                      : "text.primary",
                                }}
                              >
                                {formatDate(task.dueDate)}
                              </Typography>
                            </Stack>

                            {canSubmit ? (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<CloudUploadOutlinedIcon />}
                                onClick={() => openSubmissionDialog(task)}
                                sx={{
                                  mt: 2,
                                  minHeight: 36,
                                  px: 2,
                                  textTransform: "none",
                                  fontWeight: 700,
                                  borderRadius: 2,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {latestAttempt
                                  ? "Resubmit Homework"
                                  : "Submit Homework"}
                              </Button>
                            ) : (
                              <Chip
                                icon={<CheckCircleOutlineRoundedIcon />}
                                label={
                                  task.submissionStatus === "graded"
                                    ? "Graded"
                                    : "Submission Received"
                                }
                                color={
                                  task.submissionStatus === "graded"
                                    ? "success"
                                    : "info"
                                }
                                size="small"
                                sx={{ mt: 2, fontWeight: 700 }}
                              />
                            )}
                          </Box>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            color: "text.secondary",
                            lineHeight: 1.5,
                          }}
                        >
                          {status.description}
                        </Typography>

                        {/* Latest submission information */}
                        {latestAttempt && (
                          <Box
                            sx={{
                              mt: 2,
                              p: 2,
                              borderRadius: 2,
                              bgcolor: "action.hover",
                            }}
                          >
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Typography variant="body2" fontWeight={700}>
                                Attempt {latestAttempt.attemptNumber}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Submitted:{" "}
                                {formatDateTime(latestAttempt.submittedAt)}
                              </Typography>
                            </Stack>

                            {latestAttempt.marks !== null &&
                              latestAttempt.marks !== undefined && (
                                <Typography
                                  variant="body2"
                                  sx={{ mt: 1 }}
                                  fontWeight={700}
                                >
                                  Marks: {latestAttempt.marks}
                                </Typography>
                              )}

                            {latestAttempt.feedback && (
                              <Alert
                                severity={
                                  latestAttempt.status ===
                                  "resubmission_required"
                                    ? "warning"
                                    : "info"
                                }
                                sx={{ mt: 1.5 }}
                              >
                                <Typography variant="body2" fontWeight={700}>
                                  Teacher Feedback
                                </Typography>
                                {latestAttempt.feedback}
                              </Alert>
                            )}
                            {fileViewError && (
                              <Alert severity="error" sx={{ mt: 2 }}>
                                {fileViewError}
                              </Alert>
                            )}

                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{ mt: 1.5 }}
                            >
                              Uploaded Files
                            </Typography>

                            {renderSubmissionFiles(
                              task.submission,
                              latestAttempt,
                              latestAttempt.files,
                            )}
                          </Box>
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

      {/* Submission dialog */}
      <Dialog
        open={Boolean(selectedHomework)}
        onClose={closeSubmissionDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Submit Homework</DialogTitle>

        <DialogContent>
          {selectedHomework && (
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Box>
                <Typography fontWeight={700}>
                  {selectedHomework.title}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {selectedHomework.description}
                </Typography>
              </Box>

              <Alert severity="info">
                Upload up to 5 files. Accepted formats: JPG, PNG, and PDF. Each
                file must be 10 MB or smaller.
              </Alert>

              {uploadError && <Alert severity="error">{uploadError}</Alert>}

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                multiple
                hidden
                onChange={handleFileSelection}
              />

              <Button
                variant="outlined"
                startIcon={<CloudUploadOutlinedIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || selectedFiles.length >= MAX_FILES}
                fullWidth
                sx={{ minHeight: 48, textTransform: "none" }}
              >
                Choose Photos or PDFs
              </Button>

              <Typography variant="caption" color="text.secondary">
                {selectedFiles.length} of {MAX_FILES} files selected
              </Typography>

              {selectedFiles.map((item) => (
                <Card
                  key={item.id}
                  variant="outlined"
                  sx={{ borderRadius: 2, overflow: "hidden" }}
                >
                  <CardContent sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {item.previewUrl ? (
                        <Box
                          component="img"
                          src={item.previewUrl}
                          alt={item.file.name}
                          sx={{
                            width: 64,
                            height: 64,
                            objectFit: "cover",
                            borderRadius: 1,
                          }}
                        />
                      ) : item.file.type === "application/pdf" ? (
                        <PictureAsPdfOutlinedIcon
                          sx={{ fontSize: 38, color: "error.main" }}
                        />
                      ) : (
                        <InsertDriveFileOutlinedIcon sx={{ fontSize: 38 }} />
                      )}

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ overflowWrap: "anywhere" }}
                        >
                          {item.file.name}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                        </Typography>
                      </Box>

                      <IconButton
                        color="error"
                        onClick={() => removeSelectedFile(item.id)}
                        disabled={uploading}
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <DeleteOutlineRoundedIcon />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={closeSubmissionDialog}
            disabled={uploading}
            color="inherit"
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmitHomework}
            disabled={uploading || selectedFiles.length === 0}
            startIcon={
              uploading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CloudUploadOutlinedIcon />
              )
            }
          >
            {uploading ? "Uploading..." : "Submit Assignment"}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default StudentHomework;
