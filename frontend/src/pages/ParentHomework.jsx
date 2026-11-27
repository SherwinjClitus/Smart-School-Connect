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
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
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
};

const metricCards = [
  {
    label: "Total",
    key: "total",
    color: "text.primary",
  },
  {
    label: "Pending",
    key: "pending",
    color: "warning.main",
  },
  {
    label: "Overdue",
    key: "overdue",
    color: "error.main",
  },
  {
    label: "Completed",
    key: "completed",
    color: "success.main",
  },
];

const sectionCardSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: 2.5,
  bgcolor: "background.paper",
  backgroundImage: "none",
};

function ParentHomework() {
  const location = useLocation();

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(
    location.state?.selectedChild || "all",
  );
  const [filter, setFilter] = useState(location.state?.filter || "all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchChildrenHomework = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/homework/parent");

      const receivedChildren = response.data.children || [];
      setChildren(receivedChildren);

      if (
        selectedChild !== "all" &&
        !receivedChildren.some((item) => getChildId(item) === selectedChild)
      ) {
        setSelectedChild("all");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load children's homework.",
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
          (filter === "pending" && task.taskState !== "completed") ||
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
  }, [allHomework, selectedChild, filter, search]);

  const stats = useMemo(
    () => ({
      total: allHomework.length,
      pending: allHomework.filter((task) => task.taskState !== "completed")
        .length,
      overdue: allHomework.filter((task) => task.taskState === "overdue")
        .length,
      today: allHomework.filter((task) => task.taskState === "today").length,
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
    { value: "overdue", label: "Overdue", count: stats.overdue },
    { value: "today", label: "Due Today", count: stats.today },
    { value: "completed", label: "Completed", count: stats.completed },
  ];

  return (
    <DashboardLayout title="Children's Homework">
      <Box sx={{ maxWidth: 1200, mx: "auto", pb: 5 }}>
        {/* Page heading */}
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
              Homework Tracker
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                lineHeight: 1.5,
              }}
            >
              Monitor assignments, deadlines, and your children's progress.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchChildrenHomework}
            disabled={loading}
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
        ) : children.length === 0 ? (
          <Card elevation={0} sx={sectionCardSx}>
            <CardContent sx={{ p: 5, textAlign: "center" }}>
              <SchoolOutlinedIcon
                sx={{
                  fontSize: 42,
                  color: "text.secondary",
                  mb: 1.5,
                }}
              />

              <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
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
            {/* Overview metrics */}
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
              {metricCards.map((item) => (
                <Card key={item.label} elevation={0} sx={sectionCardSx}>
                  <CardContent
                    sx={{
                      p: 2.5,
                      "&:last-child": { pb: 2.5 },
                    }}
                  >
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
                        color: item.color,
                        mt: 0.75,
                        lineHeight: 1.2,
                        fontSize: {
                          xs: "1.75rem",
                          sm: "2rem",
                        },
                      }}
                    >
                      {stats[item.key]}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Child selection and search */}
            <Card elevation={0} sx={{ ...sectionCardSx, mb: 2.5 }}>
              <CardContent
                sx={{
                  p: 2.5,
                  "&:last-child": { pb: 2.5 },
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
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

            {/* Status filters */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.25 }}>
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
            </Box>

            {/* Assignment list heading */}
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: "text.primary",
                    lineHeight: 1.4,
                  }}
                >
                  {selectedChildName}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.25 }}
                >
                  {visibleHomework.length} assignments shown
                </Typography>
              </Box>
            </Stack>

            {/* Assignment list */}
            {visibleHomework.length === 0 ? (
              <Card
                elevation={0}
                sx={{
                  border: 1,
                  borderStyle: "dashed",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  textAlign: "center",
                  py: 6,
                  px: 2,
                  bgcolor: "background.paper",
                }}
              >
                <AssignmentOutlinedIcon
                  sx={{
                    fontSize: 40,
                    color: "text.secondary",
                    mb: 1,
                  }}
                />

                <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                  No assignments found
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.5 }}
                >
                  Try another status filter or search term.
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
                {visibleHomework.map((task) => {
                  const status =
                    statusConfig[task.taskState] || statusConfig.pending;

                  return (
                    <Card
                      key={task._id}
                      elevation={0}
                      sx={{
                        ...sectionCardSx,
                        transition: "0.2s",
                        "&:hover": {
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          p: { xs: 2.5, sm: 3 },
                          "&:last-child": {
                            pb: { xs: 2.5, sm: 3 },
                          },
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          sx={{
                            justifyContent: "space-between",
                            alignItems: {
                              xs: "flex-start",
                              sm: "flex-start",
                            },
                            gap: 2.5,
                          }}
                        >
                          <Box
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              width: "100%",
                            }}
                          >
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
                                mb: 2,
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
                                alignItems: "center",
                                flexWrap: "wrap",
                                columnGap: 2.5,
                                rowGap: 1,
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={0.75}
                                sx={{ alignItems: "center" }}
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
                                  sx={{ color: "text.secondary" }}
                                >
                                  {task.studentName}
                                </Typography>
                              </Stack>

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
                              maxWidth: { sm: 220 },
                              flexShrink: 0,
                              textAlign: {
                                xs: "left",
                                sm: "right",
                              },
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

                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                color: "text.secondary",
                                mt: 0.75,
                                lineHeight: 1.5,
                              }}
                            >
                              {status.description}
                            </Typography>
                          </Box>
                        </Stack>

                        {task.taskState === "completed" && task.updatedAt && (
                          <>
                            <Divider sx={{ my: 2 }} />

                            <Typography
                              variant="caption"
                              sx={{
                                color: "success.main",
                                fontWeight: 600,
                              }}
                            >
                              Updated: {formatDate(task.updatedAt)}
                            </Typography>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}

            <Alert severity="info" sx={{ mt: 4 }}>
              This page is for monitoring only. Your child marks homework
              complete from their Student account.
            </Alert>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default ParentHomework;
