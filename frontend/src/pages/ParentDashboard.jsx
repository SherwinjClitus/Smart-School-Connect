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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";

function getChildId(item) {
  return String(item?.child?._id || item?.child?.id || "");
}

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

  return dueDate < today
    ? "overdue"
    : dueDate.getTime() === today.getTime()
      ? "today"
      : "upcoming";
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
  border: "1px solid #E1EAF5",
  borderRadius: 2.5,
  mb: 3,
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
  color: "#1E293B",
  lineHeight: 1.4,
};

const sectionSubtitleSx = {
  color: "text.secondary",
  mt: 0.25,
};

function ParentDashboard() {
  const navigate = useNavigate();

  const [children, setChildren] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedChild, setSelectedChild] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [homeworkResult, announcementResult] = await Promise.allSettled([
          api.get("/homework/parent"),
          api.get("/messages/parent"),
        ]);

        if (homeworkResult.status === "rejected") {
          throw homeworkResult.reason;
        }

        setChildren(homeworkResult.value.data.children || []);

        if (announcementResult.status === "fulfilled") {
          setAnnouncements(announcementResult.value.data.messages || []);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load your parent dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const visibleChildren = useMemo(() => {
    if (selectedChild === "all") return children;

    return children.filter((item) => getChildId(item) === selectedChild);
  }, [children, selectedChild]);

  const allHomework = useMemo(
    () =>
      visibleChildren.flatMap((item) =>
        (item.homework || []).map((task) => ({
          ...task,
          studentName: item.child?.name || "Unknown",
          studentId: getChildId(item),
          taskState: getTaskState(task),
        })),
      ),
    [visibleChildren],
  );

  const stats = useMemo(
    () => ({
      total: allHomework.length,
      overdue: allHomework.filter((task) => task.taskState === "overdue")
        .length,
      today: allHomework.filter((task) => task.taskState === "today").length,
      upcoming: allHomework.filter(
        (task) => task.taskState === "upcoming" || task.taskState === "pending",
      ).length,
      completed: allHomework.filter((task) => task.taskState === "completed")
        .length,
    }),
    [allHomework],
  );

  const attentionTasks = useMemo(
    () =>
      [...allHomework]
        .filter((task) => ["overdue", "today"].includes(task.taskState))
        .sort((a, b) => {
          if (a.taskState !== b.taskState) {
            return a.taskState === "overdue" ? -1 : 1;
          }

          return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
        })
        .slice(0, 5),
    [allHomework],
  );

  const recentTasks = useMemo(
    () =>
      [...allHomework]
        .sort(
          (a, b) =>
            new Date(a.dueDate || a.createdAt || 0) -
            new Date(b.dueDate || b.createdAt || 0),
        )
        .slice(0, 4),
    [allHomework],
  );

  const latestAnnouncement = useMemo(
    () =>
      [...announcements].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      )[0],
    [announcements],
  );

  const selectedChildName =
    selectedChild === "all"
      ? "All Children"
      : visibleChildren[0]?.child?.name || "Selected Child";

  const statCards = [
    {
      label: "Overdue",
      value: stats.overdue,
      helper: "Needs attention",
      icon: WarningAmberRoundedIcon,
      color: "#C62828",
      background: "#FFF0F0",
    },
    {
      label: "Due Today",
      value: stats.today,
      helper: "Complete today",
      icon: TodayOutlinedIcon,
      color: "#B76E00",
      background: "#FFF5E5",
    },
    {
      label: "Upcoming",
      value: stats.upcoming,
      helper: "Future assignments",
      icon: AssignmentOutlinedIcon,
      color: "#1976D2",
      background: "#EAF2FF",
    },
    {
      label: "Completed",
      value: stats.completed,
      helper: "Finished assignments",
      icon: CheckCircleOutlineRoundedIcon,
      color: "#2E7D32",
      background: "#EAF6EC",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Parent Overview">
        <Box
          sx={{
            minHeight: "55vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Parent Overview">
      <Box sx={{ maxWidth: 1200, mx: "auto", pb: 5 }}>
        {/* Welcome and child selector */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
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
              Parent Overview
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5, lineHeight: 1.5 }}
            >
              Here's what needs your attention at school.
            </Typography>
          </Box>

          {children.length > 0 && (
            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", md: 220 } }}
            >
              <InputLabel id="dashboard-child-label">Viewing</InputLabel>

              <Select
                labelId="dashboard-child-label"
                value={selectedChild}
                label="Viewing"
                onChange={(event) => setSelectedChild(event.target.value)}
              >
                <MenuItem value="all">All Children</MenuItem>

                {children.map((item) => (
                  <MenuItem key={getChildId(item)} value={getChildId(item)}>
                    {item.child?.name || "Unknown"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {children.length === 0 ? (
          <Card
            elevation={0}
            sx={{ border: "1px solid #E1EAF5", borderRadius: 3 }}
          >
            <CardContent sx={{ p: 5, textAlign: "center" }}>
              <SchoolOutlinedIcon
                sx={{ fontSize: 42, color: "#94A3B8", mb: 1.5 }}
              />

              <Typography sx={{ fontWeight: 700 }}>
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
            {/* Summary */}
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
                  <Card
                    key={item.label}
                    elevation={0}
                    sx={{
                      border: "1px solid #E1EAF5",
                      borderRadius: 2.5,
                    }}
                  >
                    <CardContent
                      sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}
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
                            sx={{ color: "text.secondary", fontWeight: 600 }}
                          >
                            {item.label}
                          </Typography>

                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 800,
                              color: "#1E293B",
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
                            bgcolor: item.background,
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

            {/* Attention section */}
            <Card elevation={0} sx={sectionCardSx}>
              <CardContent sx={sectionContentSx}>
                <Stack direction="row" sx={sectionHeaderSx}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={sectionTitleSx}>
                      Needs your attention
                    </Typography>

                    <Typography variant="body2" sx={sectionSubtitleSx}>
                      Overdue and due-today assignments
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={() =>
                      navigate("/parent/homework", {
                        state: { filter: "overdue" },
                      })
                    }
                    sx={{
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      minHeight: 34,
                    }}
                  >
                    View all
                  </Button>
                </Stack>

                {attentionTasks.length === 0 ? (
                  <Alert severity="success">
                    Nothing needs immediate attention. There are no overdue or
                    due-today assignments.
                  </Alert>
                ) : (
                  <Stack divider={<Divider flexItem />} spacing={0}>
                    {attentionTasks.map((task) => (
                      <Stack
                        key={task._id}
                        direction={{ xs: "column", sm: "row" }}
                        sx={{
                          justifyContent: "space-between",
                          alignItems: { xs: "flex-start", sm: "center" },
                          gap: 1.5,
                          py: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              lineHeight: 1.4,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {task.title}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.5 }}
                          >
                            {task.studentName} · Due {formatDate(task.dueDate)}
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
                          sx={{ fontWeight: 700, flexShrink: 0 }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Children summary */}
            <Card elevation={0} sx={sectionCardSx}>
              <CardContent sx={sectionContentSx}>
                <Stack direction="row" sx={sectionHeaderSx}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={sectionTitleSx}>
                      {selectedChild === "all"
                        ? "Children's Progress"
                        : `${selectedChildName}'s Progress`}
                    </Typography>

                    <Typography variant="body2" sx={sectionSubtitleSx}>
                      A quick assignment overview
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    onClick={() => navigate("/parent/homework")}
                    sx={{
                      textTransform: "none",
                      flexShrink: 0,
                      minHeight: 34,
                    }}
                  >
                    Homework
                  </Button>
                </Stack>

                <Stack divider={<Divider flexItem />} spacing={0}>
                  {visibleChildren.map((item) => {
                    const homework = (item.homework || []).map((task) => ({
                      ...task,
                      taskState: getTaskState(task),
                    }));

                    const completed = homework.filter(
                      (task) => task.taskState === "completed",
                    ).length;

                    const overdue = homework.filter(
                      (task) => task.taskState === "overdue",
                    ).length;

                    const percentage = homework.length
                      ? Math.round((completed / homework.length) * 100)
                      : 0;

                    return (
                      <Stack
                        key={getChildId(item)}
                        direction={{ xs: "column", sm: "row" }}
                        sx={{
                          justifyContent: "space-between",
                          alignItems: { xs: "flex-start", sm: "center" },
                          gap: 2,
                          py: 2.5,
                        }}
                      >
                        <Stack
                          direction="row"
                          sx={{ alignItems: "center", gap: 1.5 }}
                        >
                          <Avatar
                            sx={{
                              flexShrink: 0,
                              bgcolor: "#EAF2FF",
                              color: "#1976D2",
                              fontWeight: 700,
                            }}
                          >
                            {item.child?.name?.charAt(0)?.toUpperCase() || "?"}
                          </Avatar>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{ fontWeight: 700, lineHeight: 1.4 }}
                            >
                              {item.child?.name || "Unknown"}
                            </Typography>

                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                color: "text.secondary",
                              }}
                            >
                              {homework.length} assignments
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack
                          direction="row"
                          sx={{
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1.25,
                          }}
                        >
                          <Chip
                            size="small"
                            label={`${percentage}% completed`}
                            color="success"
                            variant="outlined"
                          />

                          {overdue > 0 && (
                            <Chip
                              size="small"
                              label={`${overdue} overdue`}
                              color="error"
                            />
                          )}

                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedChild(getChildId(item));
                              navigate("/parent/homework");
                            }}
                            sx={{ textTransform: "none", minHeight: 32 }}
                          >
                            View
                          </Button>
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>

            {/* Upcoming assignments */}
            <Card elevation={0} sx={sectionCardSx}>
              <CardContent sx={sectionContentSx}>
                <Stack direction="row" sx={sectionHeaderSx}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={sectionTitleSx}>
                      Upcoming Assignments
                    </Typography>

                    <Typography variant="body2" sx={sectionSubtitleSx}>
                      What's coming next
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={() => navigate("/parent/homework")}
                    sx={{
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      minHeight: 34,
                    }}
                  >
                    All homework
                  </Button>
                </Stack>

                {recentTasks.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary" }}
                  >
                    No assignments available.
                  </Typography>
                ) : (
                  <Stack divider={<Divider flexItem />} spacing={0}>
                    {recentTasks.map((task) => (
                      <Stack
                        key={task._id}
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 2,
                          py: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 600,
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
                            {task.studentName} · {formatDate(task.dueDate)}
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          sx={{ flexShrink: 0 }}
                          label={
                            task.taskState === "completed"
                              ? "Completed"
                              : task.taskState === "overdue"
                                ? "Overdue"
                                : task.taskState === "today"
                                  ? "Due Today"
                                  : "Upcoming"
                          }
                          color={
                            task.taskState === "completed"
                              ? "success"
                              : task.taskState === "overdue"
                                ? "error"
                                : task.taskState === "today"
                                  ? "warning"
                                  : "info"
                          }
                        />
                      </Stack>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Latest announcement */}
            <Card
              elevation={0}
              sx={{
                border: "1px solid #DCE8FA",
                borderRadius: 2.5,
                background: "#F8FBFF",
              }}
            >
              <CardContent sx={sectionContentSx}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: "flex-start" }}
                >
                  <Avatar
                    variant="rounded"
                    sx={{
                      flexShrink: 0,
                      bgcolor: "#EAF2FF",
                      color: "#1976D2",
                    }}
                  >
                    <CampaignOutlinedIcon />
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={sectionTitleSx}>
                      Latest School Announcement
                    </Typography>

                    {latestAnnouncement ? (
                      <>
                        <Typography
                          sx={{ fontWeight: 700, mt: 1.5, lineHeight: 1.4 }}
                        >
                          {latestAnnouncement.subject}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            mt: 0.75,
                            lineHeight: 1.6,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {latestAnnouncement.content}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            color: "text.secondary",
                            mt: 1.25,
                          }}
                        >
                          {latestAnnouncement.createdAt
                            ? formatDate(latestAnnouncement.createdAt)
                            : ""}
                        </Typography>
                      </>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mt: 1 }}
                      >
                        No school announcements available.
                      </Typography>
                    )}

                    <Button
                      size="small"
                      onClick={() => navigate("/parent/messages")}
                      sx={{
                        mt: 1.5,
                        px: 0,
                        textTransform: "none",
                        minHeight: 32,
                      }}
                    >
                      View announcements
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default ParentDashboard;