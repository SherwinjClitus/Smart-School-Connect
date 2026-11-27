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
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";

function getDayStart(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getTaskState(task) {
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

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusConfig = {
  overdue: {
    label: "Overdue",
    color: "error",
    description: "The due date has passed. Complete this as soon as possible.",
  },
  today: {
    label: "Due Today",
    color: "warning",
    description: "Try to finish this assignment today.",
  },
  upcoming: {
    label: "Upcoming",
    color: "info",
    description: "You still have time to complete this assignment.",
  },
  pending: {
    label: "Pending",
    color: "warning",
    description: "No due date has been specified.",
  },
  completed: {
    label: "Completed",
    color: "success",
    description: "You have completed this assignment.",
  },
};

function StudentHomework() {
  const [homework, setHomework] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState(null);

  async function fetchHomework() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/homework/student");

      setHomework(response.data.homework || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load homework.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHomework();
  }, []);

  async function handleComplete(homeworkId) {
    try {
      setError("");
      setCompletingId(homeworkId);

      await api.patch(`/homework/${homeworkId}/complete`);

      setHomework((previousHomework) =>
        previousHomework.map((task) =>
          task._id === homeworkId ? { ...task, status: "completed" } : task,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update homework. Please try again.",
      );
    } finally {
      setCompletingId(null);
    }
  }

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
      pending: tasks.filter((task) => task.taskState !== "completed").length,
      overdue: tasks.filter((task) => task.taskState === "overdue").length,
      today: tasks.filter((task) => task.taskState === "today").length,
      completed: tasks.filter((task) => task.taskState === "completed").length,
    }),
    [tasks],
  );

  const filters = [
    { value: "all", label: "All", count: stats.total },
    { value: "pending", label: "Pending", count: stats.pending },
    { value: "overdue", label: "Overdue", count: stats.overdue },
    { value: "today", label: "Due Today", count: stats.today },
    { value: "completed", label: "Completed", count: stats.completed },
  ];

  const filteredHomework = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const matchesFilter =
          filter === "all" ||
          (filter === "pending" && task.taskState !== "completed") ||
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
          overdue: 0,
          today: 1,
          upcoming: 2,
          pending: 3,
          completed: 4,
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
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

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
                color: "#1E293B",
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
              Manage your assignments and keep track of deadlines.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchHomework}
            disabled={loading || completingId !== null}
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
            <Card
              elevation={0}
              sx={{
                border: "1px solid #E1EAF5",
                borderRadius: 2.5,
                mb: 3.5,
              }}
            >
              <CardContent
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  "&:last-child": { pb: { xs: 2.5, sm: 3 } },
                }}
              >
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
                      {stats.completed} of {stats.total} assignments completed
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
                    bgcolor: "#E8EEF5",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${progress}%`,
                      bgcolor: "#2E7D32",
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon color="action" />
                  </InputAdornment>
                ),
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
              <Typography sx={{ fontWeight: 800, color: "#1E293B" }}>
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
                  border: "1px dashed #CBD5E1",
                  borderRadius: 2.5,
                  textAlign: "center",
                  py: 6,
                  px: 2,
                }}
              >
                <AssignmentOutlinedIcon
                  sx={{ fontSize: 42, color: "#94A3B8", mb: 1 }}
                />

                <Typography sx={{ fontWeight: 700 }}>
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

                  const isCompleting = completingId === task._id;

                  return (
                    <Card
                      key={task._id}
                      elevation={0}
                      sx={{
                        border: "1px solid #E1EAF5",
                        borderRadius: 2.5,
                        transition: "0.2s",
                        "&:hover": {
                          borderColor: "#A8C5E8",
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          p: { xs: 2.5, sm: 3 },
                          "&:last-child": { pb: { xs: 2.5, sm: 3 } },
                        }}
                      >
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
                                  color: "#1E293B",
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
                              minWidth: { sm: 170 },
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

                            {task.status === "completed" ? (
                              <Chip
                                icon={<CheckCircleOutlineRoundedIcon />}
                                label="Completed"
                                color="success"
                                size="small"
                                sx={{ mt: 2, fontWeight: 700 }}
                              />
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={
                                  isCompleting ? (
                                    <CircularProgress
                                      size={15}
                                      color="inherit"
                                    />
                                  ) : (
                                    <CheckCircleOutlineRoundedIcon />
                                  )
                                }
                                disabled={isCompleting || completingId !== null}
                                onClick={() => handleComplete(task._id)}
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
                                {isCompleting ? "Saving..." : "Mark Complete"}
                              </Button>
                            )}
                          </Box>
                        </Stack>

                        {task.status !== "completed" && (
                          <>
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

export default StudentHomework;
