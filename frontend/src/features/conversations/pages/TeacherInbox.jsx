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
  useTheme,
} from "@mui/material";

import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import DashboardLayout from "../../../components/layout/DashboardLayout";
import conversationService from "../services/conversationService";

// Status configuration
const statusConfig = {
  open: {
    label: "Open",
    background: "#FFF4E5",
    text: "#B76E00",
    border: "#FFE0A8",
  },
  in_progress: {
    label: "In Progress",
    background: "#EAF2FF",
    text: "#1976D2",
    border: "#C9DCFF",
  },
  resolved: {
    label: "Resolved",
    background: "#E8F5E9",
    text: "#2E7D32",
    border: "#C5E5C8",
  },
  archived: {
    label: "Archived",
    background: "#F1F5F9",
    text: "#64748B",
    border: "#DCE3EA",
  },
};

// Category configuration
const categoryConfig = {
  attendance: {
    label: "Attendance",
    color: "#1976D2",
    background: "#EAF2FF",
  },
  urgent: {
    label: "Urgent",
    color: "#D32F2F",
    background: "#FDECEC",
  },
  academic: {
    label: "Academic",
    color: "#7B61A8",
    background: "#F1EAFF",
  },
  homework: {
    label: "Homework",
    color: "#ED8B00",
    background: "#FFF3DF",
  },
  administrative: {
    label: "Administrative",
    color: "#00897B",
    background: "#E3F5F2",
  },
};

function formatDate(date) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString();
}
async function fetchTeacherConversations() {
  return conversationService.getMyConversations();
}

function TeacherInbox() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("inbox");

  // Theme-aware reusable styles
  const cardSx = {
    bgcolor: "background.paper",
    color: "text.primary",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2.5,
    backgroundImage: "none",
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "background.default",
      color: "text.primary",
      borderRadius: 2,
      "& fieldset": {
        borderColor: "divider",
      },
      "&:hover fieldset": {
        borderColor: "text.secondary",
      },
    },
    "& .MuiInputLabel-root": {
      color: "text.secondary",
    },
    "& .MuiSelect-icon": {
      color: "text.secondary",
    },
  };

  // Fetch conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await conversationService.getMyConversations();

      setConversations(data.conversations || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load conversations. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    fetchTeacherConversations()
      .then((data) => {
        if (!isActive) return;

        setConversations(data.conversations || []);
        setError("");
      })
      .catch((err) => {
        if (!isActive) return;

        setError(
          err.response?.data?.message ||
            "Unable to load conversations. Please try again.",
        );
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  // Conversation statistics
  const stats = useMemo(() => {
    return {
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
    };
  }, [conversations]);

  // Search and filter
  const filteredConversations = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const conversationsForView = conversations.filter((item) => {
      if (view === "inbox") {
        return ["open", "in_progress"].includes(item.status);
      }

      return ["resolved", "archived"].includes(item.status);
    });

    return conversationsForView.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const searchableFields = [
        item.subject,
        item.parent?.name,
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

  // Statistics cards
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
      icon: MarkEmailUnreadOutlinedIcon,
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
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          pb: 4,
          color: "text.primary",
        }}
      >
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
            <Stack
              direction="row"
              sx={{ alignItems: "center", gap: 1.5, mb: 0.75 }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  borderRadius: 2,
                  bgcolor: isDark ? "rgba(96,165,250,0.16)" : "#EAF2FF",
                  color: isDark ? "#93C5FD" : "#1976D2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ForumOutlinedIcon fontSize="medium" />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "text.primary",
                  letterSpacing: "-0.6px",
                  fontSize: { xs: "1.6rem", sm: "2rem" },
                  lineHeight: 1.2,
                }}
              >
                Direct Messages
              </Typography>
            </Stack>

            <Typography
              variant="body2"
              sx={{ color: "text.secondary", lineHeight: 1.5 }}
            >
              Manage private conversations with parents about their children.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
          >
            <Button
              variant="contained"
              size="small"
              startIcon={<AddRoundedIcon />}
              onClick={() => navigate("/teacher/conversations/new")}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 0.8,
                minHeight: 36,
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              New Conversation
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              onClick={loadConversations}
              disabled={loading}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 0.8,
                minHeight: 36,
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Statistics */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
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
                  position: "relative",
                  minHeight: 115,
                  bgcolor: isDark ? "background.paper" : item.background,
                  color: "text.primary",
                  border: `1px solid ${
                    isDark ? theme.palette.divider : item.border
                  }`,
                  borderRadius: 2.5,
                  transition: "0.2s ease",
                  backgroundImage: "none",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: isDark
                      ? "0 6px 16px rgba(0,0,0,0.2)"
                      : "0 6px 16px rgba(25,118,210,0.08)",
                  },
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 600,
                      pr: 6,
                    }}
                  >
                    {item.label}
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: "text.primary",
                      mt: 1.5,
                      fontSize: { xs: "1.75rem", sm: "2rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    {item.value}
                  </Typography>

                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: isDark ? "background.default" : "#FFFFFF",
                      color: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isDark
                        ? "none"
                        : "0 3px 10px rgba(15,23,42,0.06)",
                    }}
                  >
                    <Icon sx={{ fontSize: 22 }} />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Inbox and Archived Views */}
        <Box
          sx={{
            mb: 2.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Tabs
            value={view}
            onChange={(event, newValue) => {
              setView(newValue);
              setStatusFilter("all");
              setSearch("");
            }}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 46,
              "& .MuiTab-root": {
                minHeight: 46,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: "text.secondary",
              },
              "& .Mui-selected": {
                color: "primary.main",
              },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: 2,
              },
            }}
          >
            <Tab value="inbox" label={`Inbox (${stats.active})`} />
            <Tab value="archived" label={`Archived (${stats.archived})`} />
          </Tabs>
        </Box>

        {/* Search and Filters */}
        <Card
          elevation={0}
          sx={{
            ...cardSx,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.95rem",
                mb: 1.5,
                color: "text.primary",
              }}
            >
              Find Conversations
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by subject, parent, student or class..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <SearchRoundedIcon
                        sx={{
                          mr: 1,
                          color: "text.secondary",
                          fontSize: 21,
                        }}
                      />
                    ),
                  },
                }}
                sx={inputSx}
              />

              <FormControl
                size="small"
                sx={{
                  minWidth: { xs: "100%", sm: 200 },
                  ...inputSx,
                }}
              >
                <InputLabel>Status</InputLabel>

                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(event) => setStatusFilter(event.target.value)}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: "background.paper",
                        color: "text.primary",
                        backgroundImage: "none",
                      },
                    },
                  }}
                >
                  <MenuItem value="all">
                    {view === "inbox" ? "All Active" : "All Archived"}
                  </MenuItem>

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

        {/* Conversation List Heading */}
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
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              lineHeight: 1.3,
            }}
          >
            {view === "inbox"
              ? "Active Conversations"
              : "Archived Conversations"}
          </Typography>

          <Chip
            label={`${filteredConversations.length} found`}
            size="small"
            sx={{
              height: 25,
              bgcolor: isDark ? "rgba(96,165,250,0.16)" : "#EAF2FF",
              color: isDark ? "#93C5FD" : "#1976D2",
              fontWeight: 700,
            }}
          />
        </Stack>

        {/* Loading */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredConversations.length === 0 ? (
          /* Empty State */
          <Card
            elevation={0}
            sx={{
              ...cardSx,
            }}
          >
            <CardContent sx={{ py: 5, textAlign: "center" }}>
              <Avatar
                sx={{
                  width: 54,
                  height: 54,
                  bgcolor: isDark ? "rgba(96,165,250,0.16)" : "#E1EDFF",
                  color: isDark ? "#93C5FD" : "#1976D2",
                  mx: "auto",
                  mb: 1.5,
                }}
              >
                <ForumOutlinedIcon fontSize="medium" />
              </Avatar>

              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "text.primary" }}
              >
                No conversations found
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                {search || statusFilter !== "all"
                  ? "Try changing your search or status filter."
                  : view === "inbox"
                    ? "No active conversations. New parent conversations will appear here."
                    : "No resolved or archived conversations yet."}
              </Typography>

              {(search || statusFilter !== "all") && (
                <Button
                  size="small"
                  variant="outlined"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Conversation Cards */
          <Stack spacing={1.5}>
            {filteredConversations.map((conversation) => {
              const status =
                statusConfig[conversation.status] || statusConfig.archived;

              const category = categoryConfig[conversation.category] || {
                label: conversation.category || "Other",
                color: "#64748B",
                background: "#F1F5F9",
              };

              const priorityIsHigh = conversation.priority === "high";

              return (
                <Card
                  key={conversation._id}
                  elevation={0}
                  sx={{
                    ...cardSx,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: isDark
                        ? "0 5px 16px rgba(0,0,0,0.2)"
                        : "0 5px 16px rgba(15,23,42,0.06)",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      "&:last-child": { pb: { xs: 2, sm: 2.5 } },
                    }}
                  >
                    {/* Subject and Status */}
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "text.primary",
                          fontSize: "1.05rem",
                          lineHeight: 1.4,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {conversation.subject}
                      </Typography>

                      <Chip
                        label={status.label}
                        size="small"
                        sx={{
                          height: 25,
                          bgcolor: status.background,
                          color: status.text,
                          border: `1px solid ${status.border}`,
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Stack>

                    {/* Parent and Student */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "1fr 1fr",
                        },
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      {/* Parent */}
                      <Box
                        sx={{
                          px: 1.5,
                          py: 1.2,
                          borderRadius: 2,
                          bgcolor: isDark ? "rgba(96,165,250,0.08)" : "#F5F9FF",
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            color: "text.secondary",
                            fontWeight: 600,
                            lineHeight: 1.4,
                          }}
                        >
                          PARENT
                        </Typography>

                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: "text.primary",
                            fontSize: "0.9rem",
                            lineHeight: 1.5,
                          }}
                        >
                          {conversation.parent?.name || "Unknown Parent"}
                        </Typography>
                      </Box>

                      {/* Student */}
                      <Box
                        sx={{
                          px: 1.5,
                          py: 1.2,
                          borderRadius: 2,
                          bgcolor: isDark ? "rgba(45,212,191,0.08)" : "#F0FAF8",
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            color: "text.secondary",
                            fontWeight: 600,
                            lineHeight: 1.4,
                          }}
                        >
                          STUDENT
                        </Typography>

                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: "text.primary",
                            fontSize: "0.9rem",
                            lineHeight: 1.5,
                          }}
                        >
                          {conversation.student?.name || "Unknown Student"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Class */}
                    <Stack
                      direction="row"
                      sx={{ alignItems: "center", gap: 0.8, mb: 1.5 }}
                    >
                      <SchoolOutlinedIcon
                        sx={{ fontSize: 18, color: "primary.main" }}
                      />

                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Class:{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: "text.primary",
                          }}
                        >
                          {conversation.schoolClass?.name || "Unknown"}
                        </Box>
                      </Typography>
                    </Stack>

                    {/* Category and Priority */}
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 0.8,
                        mb: 1.5,
                      }}
                    >
                      <Chip
                        size="small"
                        label={category.label}
                        sx={{
                          height: 25,
                          bgcolor: category.background,
                          color: category.color,
                          border: `1px solid ${category.color}40`,
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />

                      <Chip
                        size="small"
                        label={
                          priorityIsHigh ? "High Priority" : "Normal Priority"
                        }
                        color={priorityIsHigh ? "error" : "default"}
                        variant="outlined"
                        sx={{
                          height: 25,
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Stack>

                    {/* Footer */}
                    <Box
                      sx={{
                        pt: 1.5,
                        borderTop: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Stack
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 1.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          Last activity:{" "}
                          {formatDate(conversation.lastMessageAt)}
                        </Typography>

                        <Button
                          size="small"
                          variant="contained"
                          endIcon={<ArrowForwardRoundedIcon />}
                          onClick={() =>
                            navigate(
                              `/teacher/conversations/${conversation._id}`,
                            )
                          }
                          sx={{
                            flexShrink: 0,
                            borderRadius: 2,
                            px: 1.8,
                            py: 0.7,
                            minHeight: 34,
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            boxShadow: "none",
                            "&:hover": {
                              boxShadow: "none",
                            },
                          }}
                        >
                          Open Conversation
                        </Button>
                      </Stack>
                    </Box>
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

export default TeacherInbox;
