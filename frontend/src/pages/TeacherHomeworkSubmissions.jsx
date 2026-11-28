import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import {
  ArrowBackOutlined,
  AssignmentOutlined,
  CheckCircleOutlineOutlined,
  PendingActionsOutlined,
  PeopleAltOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";

function TeacherHomeworkSubmissions() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { homeworkId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review dialog state
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("under_review");
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Secure file viewing state
  const [viewingFileId, setViewingFileId] = useState(null);
  const [fileViewError, setFileViewError] = useState("");

  // Fetch student submissions
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/submissions/homework/${homeworkId}`);

      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load student submissions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [homeworkId]);

  const students = data?.students || [];

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case "submitted":
        return "success";
      case "under_review":
        return "info";
      case "graded":
        return "success";
      case "resubmission_required":
        return "warning";
      default:
        return "default";
    }
  };

  // Status labels
  const getStatusLabel = (status) => {
    switch (status) {
      case "submitted":
        return "Submitted";
      case "under_review":
        return "Under Review";
      case "graded":
        return "Graded";
      case "resubmission_required":
        return "Resubmission Required";
      default:
        return "Pending";
    }
  };

  // Format dates
  const formatDate = (date) => {
    if (!date) return "Not submitted";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Open review dialog
  const handleOpenReview = (item) => {
    setSelectedItem(item);

    setReviewStatus(
      item.latestAttempt?.status === "submitted"
        ? "under_review"
        : item.latestAttempt?.status || "under_review",
    );

    setMarks(item.latestAttempt?.marks ?? "");
    setFeedback(item.latestAttempt?.feedback || "");

    setReviewError("");
    setFileViewError("");
  };

  // Close review dialog
  const handleCloseReview = () => {
    if (savingReview) return;

    setSelectedItem(null);
    setReviewError("");
    setFileViewError("");
  };

  // Secure file viewing
  const handleViewFile = async (submission, attempt, file) => {
    const fileId = file._id;

    if (!submission?._id || !attempt?.attemptNumber || !fileId) {
      setFileViewError("Unable to identify this submission file.");
      return;
    }

    const newWindow = window.open("about:blank", "_blank");

    if (!newWindow) {
      setFileViewError("Please allow pop-ups to view the homework file.");
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
  };

  // Submit teacher review
  const handleSubmitReview = async () => {
    if (!selectedItem?.submission || !selectedItem?.latestAttempt) {
      return;
    }

    if (reviewStatus === "resubmission_required" && !feedback.trim()) {
      setReviewError(
        "Please provide feedback explaining why resubmission is required.",
      );
      return;
    }

    if (
      marks !== "" &&
      (Number(marks) < 0 || !Number.isFinite(Number(marks)))
    ) {
      setReviewError("Please enter valid non-negative marks.");
      return;
    }

    try {
      setSavingReview(true);
      setReviewError("");

      const submissionId = selectedItem.submission._id;
      const attemptNumber = selectedItem.latestAttempt.attemptNumber;

      const reviewData = {
        status: reviewStatus,
        marks: marks === "" ? undefined : Number(marks),
        feedback: feedback.trim(),
      };

      await api.patch(
        `/submissions/${submissionId}/attempt/${attemptNumber}/review`,
        reviewData,
      );

      setSelectedItem(null);
      await fetchSubmissions();
    } catch (err) {
      setReviewError(
        err.response?.data?.message || "Unable to save the review.",
      );
    } finally {
      setSavingReview(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <DashboardLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1100, mx: "auto", pb: 4 }}>
        {/* Back button */}
        <Button
          startIcon={<ArrowBackOutlined />}
          onClick={() => navigate("/teacher/homework")}
          sx={{ mb: 3 }}
        >
          Back to Homework
        </Button>

        {/* Page error */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={fetchSubmissions}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {data && (
          <>
            {/* Page heading */}
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography variant="h4" fontWeight={700}>
                Student Submissions
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Review student progress and submitted homework.
              </Typography>
            </Stack>

            {/* Homework information */}
            <Card
              sx={{
                mb: 3,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={2}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      {data.homework.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {data.homework.description}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Chip
                        icon={<PeopleAltOutlined />}
                        label={`${data.homework.schoolClass?.name || "Class"}${
                          data.homework.schoolClass?.grade
                            ? ` • Grade ${data.homework.schoolClass.grade}`
                            : ""
                        }`}
                        size="small"
                        variant="outlined"
                      />

                      <Chip
                        label={`Due: ${formatDate(data.homework.dueDate)}`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>

                  <AssignmentOutlined
                    sx={{
                      fontSize: 48,
                      color: "primary.main",
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(3, 1fr)",
                },
                gap: 2,
                mb: 3,
              }}
            >
              <Card
                sx={{
                  boxShadow: "none",
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PeopleAltOutlined color="primary" />
                    <Typography color="text.secondary">
                      Total Students
                    </Typography>
                  </Stack>

                  <Typography variant="h4" fontWeight={700} mt={1}>
                    {data.totalStudents}
                  </Typography>
                </CardContent>
              </Card>

              <Card
                sx={{
                  boxShadow: "none",
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineOutlined color="success" />
                    <Typography color="text.secondary">Submitted</Typography>
                  </Stack>

                  <Typography variant="h4" fontWeight={700} mt={1}>
                    {data.submittedCount}
                  </Typography>
                </CardContent>
              </Card>

              <Card
                sx={{
                  boxShadow: "none",
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PendingActionsOutlined color="warning" />
                    <Typography color="text.secondary">Pending</Typography>
                  </Stack>

                  <Typography variant="h4" fontWeight={700} mt={1}>
                    {data.pendingCount}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Student list */}
            <Typography variant="h6" fontWeight={700} mb={2}>
              Class Student List
            </Typography>

            {students.length === 0 ? (
              <Alert severity="info">
                No students are currently assigned to this class.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {students.map((item) => {
                  const student = item.student;
                  const attempt = item.latestAttempt;
                  const status = item.status;

                  return (
                    <Card
                      key={student._id}
                      sx={{
                        borderRadius: 3,
                        border: 1,
                        borderColor: "divider",
                        boxShadow: "none",
                        transition: "border-color 0.2s ease",
                        "&:hover": {
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          p: { xs: 2, sm: 2.5 },
                          "&:last-child": { pb: { xs: 2, sm: 2.5 } },
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "stretch", sm: "center" }}
                          spacing={{ xs: 2, sm: 3 }}
                        >
                          {/* Student information */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontWeight={700}>
                              {student.name}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ overflowWrap: "anywhere" }}
                            >
                              {student.email}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              mt={1}
                            >
                              {attempt
                                ? `Last submitted: ${formatDate(
                                    attempt.submittedAt,
                                  )}`
                                : "No submission received yet"}
                            </Typography>

                            {attempt && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                Attempt {attempt.attemptNumber} •{" "}
                                {attempt.files.length} file(s)
                              </Typography>
                            )}
                          </Box>

                          {/* Status and action */}
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="flex-end"
                            spacing={1.5}
                            sx={{
                              flexShrink: 0,
                              alignSelf: {
                                xs: "flex-start",
                                sm: "center",
                              },
                            }}
                          >
                            <Chip
                              label={getStatusLabel(status)}
                              color={getStatusColor(status)}
                              size="small"
                            />

                            {item.submission && attempt && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityOutlined />}
                                onClick={() => handleOpenReview(item)}
                                sx={{
                                  minWidth: "auto",
                                  px: 1.5,
                                  py: 0.6,
                                  fontSize: "0.8rem",
                                  whiteSpace: "nowrap",
                                  borderRadius: 2,
                                }}
                              >
                                Review
                              </Button>
                            )}
                          </Stack>
                        </Stack>

                        {/* Previous teacher feedback */}
                        {attempt?.feedback && (
                          <>
                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body2" color="text.secondary">
                              Teacher feedback: {attempt.feedback}
                            </Typography>
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

        {/* Teacher review dialog */}
        <Dialog
          open={Boolean(selectedItem)}
          onClose={handleCloseReview}
          fullWidth
          maxWidth="sm"
          scroll="paper"
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Review Student Submission
          </DialogTitle>

          <DialogContent dividers>
            {selectedItem && (
              <Stack spacing={2}>
                {/* Student information */}
                <Box>
                  <Typography fontWeight={700}>
                    {selectedItem.student.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Attempt {selectedItem.latestAttempt.attemptNumber} •{" "}
                    Submitted:{" "}
                    {formatDate(selectedItem.latestAttempt.submittedAt)}
                  </Typography>
                </Box>

                <Divider />

                {/* Submitted files */}
                <Typography fontWeight={700}>Submitted Files</Typography>

                {fileViewError && (
                  <Alert severity="error">{fileViewError}</Alert>
                )}

                {selectedItem.latestAttempt.files?.length > 0 ? (
                  <Stack spacing={1}>
                    {selectedItem.latestAttempt.files.map((file) => (
                      <Stack
                        key={file._id}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        sx={{
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 2,
                          p: 1.5,
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ overflowWrap: "anywhere" }}
                          >
                            {file.originalName}
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </Typography>
                        </Box>

                        <Button
                          size="small"
                          startIcon={<VisibilityOutlined />}
                          disabled={viewingFileId === file._id}
                          onClick={() =>
                            handleViewFile(
                              selectedItem.submission,
                              selectedItem.latestAttempt,
                              file,
                            )
                          }
                          sx={{ flexShrink: 0 }}
                        >
                          {viewingFileId === file._id ? "Opening..." : "View"}
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info">
                    No files were found for this attempt.
                  </Alert>
                )}

                <Divider />

                {/* Review status */}
                <TextField
                  select
                  fullWidth
                  label="Review Status"
                  value={reviewStatus}
                  onChange={(event) => setReviewStatus(event.target.value)}
                >
                  <MenuItem value="under_review">Under Review</MenuItem>

                  <MenuItem value="graded">Graded</MenuItem>

                  <MenuItem value="resubmission_required">
                    Resubmission Required
                  </MenuItem>
                </TextField>

                {/* Marks */}
                <TextField
                  fullWidth
                  type="number"
                  label="Marks (optional)"
                  value={marks}
                  onChange={(event) => setMarks(event.target.value)}
                  inputProps={{ min: 0 }}
                />

                {/* Feedback */}
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Feedback / Comments"
                  placeholder="Enter feedback for the student..."
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                />

                {reviewStatus === "resubmission_required" && (
                  <Alert severity="warning">
                    The student will be allowed to submit another attempt.
                    Feedback is required to explain what needs correction.
                  </Alert>
                )}

                {reviewError && <Alert severity="error">{reviewError}</Alert>}
              </Stack>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseReview} disabled={savingReview}>
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSubmitReview}
              disabled={savingReview}
            >
              {savingReview ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Submit Review"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}

export default TeacherHomeworkSubmissions;
