import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  Stack,
  Typography,
} from "@mui/material";

import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

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

// Shared styles
const sectionCardSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: 2.5,
  mb: 3,
  bgcolor: "background.paper",
  backgroundImage: "none",
  boxShadow: "none",
};

const sectionContentSx = {
  p: { xs: 2.5, sm: 3 },
  "&:last-child": { pb: { xs: 2.5, sm: 3 } },
};

const sectionHeaderSx = {
  justifyContent: "space-between",
  alignItems: "center",
  gap: 2,
  mb: 2.5,
};

const sectionTitleSx = {
  fontWeight: 800,
  color: "text.primary",
  lineHeight: 1.4,
};

const sectionSubtitleSx = {
  color: "text.secondary",
  mt: 0.25,
};

const smallButtonSx = {
  textTransform: "none",
  whiteSpace: "nowrap",
  flexShrink: 0,
  minHeight: 34,
};

function StudentDashboard() {
  const navigate = useNavigate();

  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/homework/student");
        setHomework(response.data.homework || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load your homework.",
        );
      } finally {
        setLoading(false);
      }
    };

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
      overdue: tasks.filter((task) => task.taskState === "overdue").length,
      today: tasks.filter((task) => task.taskState === "today").length,
      upcoming: tasks.filter(
        (task) => task.taskState === "upcoming" || task.taskState === "pending",
      ).length,
      completed: tasks.filter((task) => task.taskState === "completed").length,
    }),
    [tasks],
  );

  const attentionTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => ["overdue", "today"].includes(task.taskState))
        .sort((a, b) => {
          if (a.taskState !== b.taskState) {
            return a.taskState === "overdue" ? -1 : 1;
          }

          return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
        })
        .slice(0, 5),
    [tasks],
  );

  const upcomingTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => ["upcoming", "pending"].includes(task.taskState))
        .sort(
          (a, b) =>
            new Date(a.dueDate || "9999-12-31") -
            new Date(b.dueDate || "9999-12-31"),
        )
        .slice(0, 4),
    [tasks],
  );

  const progress = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const statCards = [
    {
      label: "Overdue",
      value: stats.overdue,
      helper: "Needs attention",
      icon: WarningAmberRoundedIcon,
      color: "error.main",
    },
    {
      label: "Due Today",
      value: stats.today,
      helper: "Complete today",
      icon: TodayOutlinedIcon,
      color: "warning.main",
    },
    {
      label: "Upcoming",
      value: stats.upcoming,
      helper: "Still to complete",
      icon: AssignmentOutlinedIcon,
      color: "primary.main",
    },
    {
      label: "Completed",
      value: stats.completed,
      helper: "Finished assignments",
      icon: CheckCircleOutlineRoundedIcon,
      color: "success.main",
    },
  ];

  return (
    <DashboardLayout title="Student Overview">
      <Box sx={{ maxWidth: 1200, mx: "auto", pb: 5 }}>
        {/* Welcome */}
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
              Welcome back!
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                lineHeight: 1.5,
              }}
            >
              Here's what you need to focus on today.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={() => navigate("/student/homework")}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              flexShrink: 0,
              minHeight: 40,
              px: 2.5,
              whiteSpace: "nowrap",
              alignSelf: { xs: "flex-start", sm: "center" },
            }}
          >
            Open My Homework
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
            {/* Summary cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2.5,
                mb: 4,
              }}
            >
              {statCards.map((item) => {
                const Icon = item.icon;

                return (
                  <Card key={item.label} elevation={0} sx={sectionCardSx}>
                    <CardContent
                      sx={{
                        p: 2.5,
                        "&:last-child": { pb: 2.5 },
                      }}
                    >
                      <Stack
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1.5,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 600,
                            }}
                          >
                            {item.label}
                          </Typography>

                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 800,
                              color: "text.primary",
                              mt: 0.75,
                              lineHeight: 1.2,
                              fontSize: { xs: "1.75rem", sm: "2rem" },
                            }}
                          >
                            {item.value}
                          </Typography>
                        </Box>

                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 42,
                            height: 42,
                            flexShrink: 0,
                            bgcolor: "action.selected",
                            color: item.color,
                          }}
                        >
                          <Icon />
                        </Avatar>
                      </Stack>

                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: "text.secondary",
                          mt: 1.5,
                        }}
                      >
                        {item.helper}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>

            {/* Progress */}
            <Card elevation={0} sx={sectionCardSx}>
              <CardContent sx={sectionContentSx}>
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
                    <Typography sx={sectionTitleSx}>My Progress</Typography>

                    <Typography variant="body2" sx={sectionSubtitleSx}>
                      Your homework completion
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
                    height: 10,
                    bgcolor: "action.selected",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${progress}%`,
                      height: "100%",
                      bgcolor: "success.main",
                      borderRadius: 10,
                      transition: "width 0.3s ease",
                    }}
                  />
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    mt: 1.5,
                  }}
                >
                  {stats.completed} of {stats.total} assignments completed
                </Typography>
              </CardContent>
            </Card>

            {/* Attention tasks */}
            <Card elevation={0} sx={sectionCardSx}>
              <CardContent sx={sectionContentSx}>
                <Stack direction="row" sx={sectionHeaderSx}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={sectionTitleSx}>Focus on These</Typography>

                    <Typography variant="body2" sx={sectionSubtitleSx}>
                      Overdue and due-today assignments
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    onClick={() =>
                      navigate("/student/homework", {
                        state: { filter: "overdue" },
                      })
                    }
                    sx={smallButtonSx}
                  >
                    View all
                  </Button>
                </Stack>

                {attentionTasks.length === 0 ? (
                  <Alert severity="success">
                    Great work! You have no overdue or due-today assignments.
                  </Alert>
                ) : (
                  <Stack divider={<Divider flexItem />} spacing={0}>
                    {attentionTasks.map((task) => (
                      <Stack
                        key={task._id}
                        direction={{ xs: "column", sm: "row" }}
                        sx={{
                          justifyContent: "space-between",
                          alignItems: {
                            xs: "flex-start",
                            sm: "center",
                          },
                          gap: 1.5,
                          py: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              color: "text.primary",
                              lineHeight: 1.4,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {task.title}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mt: 0.5,
                            }}
                          >
                            Due {formatDate(task.dueDate)}
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          label={
                            task.taskState === "overdue"
                              ? "Overdue"
                              : "Due Today"
                          }
                          color={
                            task.taskState === "overdue" ? "error" : "warning"
                          }
                          sx={{
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Upcoming homework */}
            <Card elevation={0} sx={{ ...sectionCardSx, mb: 0 }}>
              <CardContent sx={sectionContentSx}>
                <Stack direction="row" sx={sectionHeaderSx}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={sectionTitleSx}>
                      Upcoming Homework
                    </Typography>

                    <Typography variant="body2" sx={sectionSubtitleSx}>
                      Plan what you need to complete next
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    onClick={() => navigate("/student/homework")}
                    sx={smallButtonSx}
                  >
                    View all
                  </Button>
                </Stack>

                {upcomingTasks.length === 0 ? (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    No upcoming assignments.
                  </Typography>
                ) : (
                  <Stack divider={<Divider flexItem />} spacing={0}>
                    {upcomingTasks.map((task) => (
                      <Stack
                        key={task._id}
                        direction="row"
                        sx={{
                          alignItems: "center",
                          gap: 2,
                          py: 2,
                        }}
                      >
                        <Avatar
                          variant="rounded"
                          sx={{
                            bgcolor: "action.selected",
                            color: "primary.main",
                            width: 38,
                            height: 38,
                            flexShrink: 0,
                          }}
                        >
                          <SchoolOutlinedIcon />
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                              lineHeight: 1.4,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {task.title}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              color: "text.secondary",
                              mt: 0.25,
                            }}
                          >
                            Due {formatDate(task.dueDate)}
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          label={
                            task.taskState === "pending"
                              ? "No due date"
                              : "Upcoming"
                          }
                          color="info"
                          variant="outlined"
                          sx={{ flexShrink: 0 }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default StudentDashboard;
