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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tabs,
  Tab,
  TextField,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";

import DashboardLayout from "../../../components/layout/DashboardLayout";
import conversationService from "../services/conversationService";

const statusConfig = {
  open: {
    label: "Open",
    background: "#FFF4E5",
    color: "#B76E00",
    border: "#FFE0A8",
  },
  in_progress: {
    label: "In Progress",
    background: "#EAF2FF",
    color: "#1976D2",
    border: "#C9DCFF",
  },
  resolved: {
    label: "Resolved",
    background: "#E8F5E9",
    color: "#2E7D32",
    border: "#C5E5C8",
  },
  archived: {
    label: "Archived",
    background: "#F1F5F9",
    color: "#64748B",
    border: "#DCE3EA",
  },
};

const categoryConfig = {
  attendance: { label: "Attendance", color: "#1976D2", background: "#EAF2FF" },
  urgent: { label: "Urgent", color: "#D32F2F", background: "#FDECEC" },
  academic: { label: "Academic", color: "#7B61A8", background: "#F1EAFF" },
  homework: { label: "Homework", color: "#ED8B00", background: "#FFF3DF" },
  administrative: {
    label: "Administrative",
    color: "#00897B",
    background: "#E3F5F2",
  },
};

function formatDate(date) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return parsedDate.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ParentInbox() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("inbox");

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await conversationService.getMyConversations();

      setConversations(data.conversations || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your conversations. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const stats = useMemo(
    () => ({
      total: conversations.length,
      open: conversations.filter((item) => item.status === "open").length,
      inProgress: conversations.filter((item) => item.status === "in_progress")
        .length,
      resolved: conversations.filter((item) => item.status === "resolved")
        .length,
      active: conversations.filter((item) =>
        ["open", "in_progress"].includes(item.status),
      ).length,
      archived: conversations.filter((item) =>
        ["resolved", "archived"].includes(item.status),
      ).length,
    }),
    [conversations],
  );

  const filteredConversations = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return conversations
      .filter((item) => {
        if (view === "inbox") {
          return ["open", "in_progress"].includes(item.status);
        }

        return ["resolved", "archived"].includes(item.status);
      })
      .filter((item) => {
        const matchesStatus =
          statusFilter === "all" || item.status === statusFilter;

        const searchableFields = [
          item.subject,
          item.teacher?.name,
          item.student?.name,
          item.schoolClass?.name,
          item.category,
        ];

        const matchesSearch =
          !searchText ||
          searchableFields
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(searchText));

        return matchesStatus && matchesSearch;
      });
  }, [conversations, search, statusFilter, view]);

  const statCards = [
    {
      label: "Total Conversations",
      value: stats.total,
      icon: AssignmentOutlinedIcon,
      color: "#1976D2",
      background: "#EAF2FF",
      border: "#C9DCFF",
    },
    {
      label: "Open",
      value: stats.open,
      icon: ForumOutlinedIcon,
      color: "#ED8B00",
      background: "#FFF3DF",
      border: "#FFE0A8",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: PendingActionsOutlinedIcon,
      color: "#0284C7",
      background: "#EAF4FF",
      border: "#C9DCFF",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      icon: CheckCircleOutlineOutlinedIcon,
      color: "#2E7D32",
      background: "#E8F5E9",
      border: "#C5E5C8",
    },
  ];

  return (
    <DashboardLayout title="Direct Messages">
      <Box sx={{ maxWidth: 1200, mx: "auto", pb: 4 }}>
        {/* Page Heading */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#1E293B",
                mb: 0.5,
                lineHeight: 1.3,
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              Parent-Teacher Conversations
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: "text.secondary", lineHeight: 1.5 }}
            >
              Communicate privately with your child's assigned teacher.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/parent/conversations/new")}
            sx={{
              alignSelf: { xs: "flex-start", sm: "center" },
              flexShrink: 0,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              px: 2.5,
              py: 1,
              minHeight: 40,
              whiteSpace: "nowrap",
            }}
          >
            New Conversation
          </Button>
        </Stack>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={loadConversations}
                sx={{ textTransform: "none" }}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Statistics */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
            mb: 3,
          }}
        >
          {statCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.label}
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${item.border}`,
                  background: "#FFFFFF",
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          mb: 0.75,
                        }}
                      >
                        {item.label}
                      </Typography>

                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 800,
                          color: "#1E293B",
                          lineHeight: 1.2,
                          fontSize: { xs: "1.75rem", sm: "2rem" },
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        background: item.background,
                        color: item.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Inbox and Archived Tabs */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid #E1EAF5",
            borderRadius: 2.5,
            mb: 2,
          }}
        >
          <Tabs
            value={view}
            onChange={(event, newValue) => {
              setView(newValue);
              setStatusFilter("all");
            }}
            sx={{
              px: 2,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 700,
                minHeight: 54,
              },
            }}
          >
            <Tab value="inbox" label={`Inbox (${stats.active})`} />
            <Tab value="archived" label={`Archived (${stats.archived})`} />
          </Tabs>
        </Card>

        {/* Search and Filters */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 2.5,
            border: "1px solid #E1EAF5",
            background: "#F8FBFF",
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                Find Conversations
              </Typography>

              <Button
                size="small"
                startIcon={<RefreshRoundedIcon />}
                onClick={loadConversations}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  flexShrink: 0,
                  minHeight: 32,
                }}
              >
                Refresh
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by subject, teacher, child or class..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchRoundedIcon
                      sx={{ mr: 1, color: "text.secondary", fontSize: 21 }}
                    />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#FFFFFF",
                    borderRadius: 2,
                  },
                }}
              />

              <FormControl
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 200 } }}
              >
                <InputLabel>Status</InputLabel>

                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(event) => setStatusFilter(event.target.value)}
                  sx={{ bgcolor: "#FFFFFF", borderRadius: 2 }}
                >
                  <MenuItem value="all">All Conversations</MenuItem>

                  {view === "inbox" ? (
                    <>
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem value="resolved">Resolved</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        {/* Conversation List */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: "#1E293B", lineHeight: 1.3 }}
          >
            {view === "inbox" ? "Your Inbox" : "Archived Conversations"}
          </Typography>

          <Chip
            label={`${filteredConversations.length} found`}
            size="small"
            sx={{
              bgcolor: "#EAF2FF",
              color: "#1976D2",
              fontWeight: 700,
            }}
          />
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredConversations.length === 0 ? (
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
            <ForumOutlinedIcon sx={{ fontSize: 42, color: "#94A3B8", mb: 1 }} />

            <Typography sx={{ fontWeight: 700, color: "#334155", mb: 0.5 }}>
              {search || statusFilter !== "all"
                ? "No matching conversations"
                : view === "inbox"
                  ? "Your inbox is empty"
                  : "No archived conversations"}
            </Typography>

            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              {view === "inbox"
                ? "Start a private conversation with your child's teacher."
                : "Resolved and archived conversations will appear here."}
            </Typography>

            {view === "inbox" && !search && statusFilter === "all" && (
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => navigate("/parent/conversations/new")}
                sx={{ textTransform: "none", borderRadius: 2, minHeight: 40 }}
              >
                Create Conversation
              </Button>
            )}
          </Card>
        ) : (
          <Stack sx={{ gap: 2 }}>
            {filteredConversations.map((item) => {
              const status = statusConfig[item.status] || statusConfig.open;

              const category = categoryConfig[item.category] || {
                label: item.category || "General",
                color: "#475569",
                background: "#F1F5F9",
              };

              const teacherName = item.teacher?.name || "Assigned Teacher";
              const studentName = item.student?.name || "Child";
              const className = item.schoolClass?.name || "Class not available";

              return (
                <Card
                  key={item._id || item.id}
                  elevation={0}
                  sx={{
                    border: "1px solid #E1EAF5",
                    borderRadius: 2.5,
                    transition: "0.2s",
                    "&:hover": {
                      borderColor: "#90B8E8",
                      boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      sx={{
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
                        <Stack
                          direction="row"
                          sx={{
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1,
                            mb: 1.5,
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
                            {item.subject}
                          </Typography>

                          <Chip
                            size="small"
                            label={status.label}
                            sx={{
                              bgcolor: status.background,
                              color: status.color,
                              border: `1px solid ${status.border}`,
                              fontWeight: 700,
                            }}
                          />
                        </Stack>

                        <Stack
                          direction="row"
                          sx={{ alignItems: "center", gap: 1.25, mb: 1.5 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              flexShrink: 0,
                              bgcolor: "#EAF2FF",
                              color: "#1976D2",
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {teacherName.charAt(0).toUpperCase()}
                          </Avatar>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: "#334155",
                                lineHeight: 1.4,
                              }}
                            >
                              {teacherName}
                            </Typography>

                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                color: "text.secondary",
                                lineHeight: 1.3,
                              }}
                            >
                              Assigned Teacher
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack
                          direction="row"
                          sx={{ flexWrap: "wrap", gap: 1, mb: 1.5 }}
                        >
                          <Chip
                            size="small"
                            label={studentName}
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />

                          <Chip
                            size="small"
                            label={className}
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />

                          <Chip
                            size="small"
                            label={category.label}
                            sx={{
                              bgcolor: category.background,
                              color: category.color,
                              fontWeight: 700,
                            }}
                          />

                          <Chip
                            size="small"
                            label={
                              item.priority === "high"
                                ? "High Priority"
                                : "Normal Priority"
                            }
                            color={
                              item.priority === "high" ? "error" : "default"
                            }
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        </Stack>

                        <Typography
                          variant="caption"
                          sx={{ display: "block", color: "text.secondary" }}
                        >
                          Last activity: {formatDate(item.lastMessageAt)}
                        </Typography>
                      </Box>

                      <Button
                        variant="outlined"
                        endIcon={<ArrowForwardRoundedIcon />}
                        onClick={() =>
                          navigate(
                            `/parent/conversations/${item._id || item.id}`,
                          )
                        }
                        sx={{
                          alignSelf: { xs: "flex-start", sm: "center" },
                          flexShrink: 0,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          minHeight: 38,
                        }}
                      >
                        Open Conversation
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

export default ParentInbox;
