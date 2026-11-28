
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";

const categoryLabels = {
  announcement: "Announcement",
  homework_reminder: "Homework Reminder",
  exam_update: "Exam Update",
  general_update: "General Update",
};

// Fetch announcements without directly updating component state.
async function fetchAnnouncementsData() {
  const response = await api.get("/messages/student");
  return response.data.messages || [];
}

function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Used by the refresh button.
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchAnnouncementsData();
      setAnnouncements(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load announcements. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial announcements fetch.
  useEffect(() => {
    let isActive = true;

    fetchAnnouncementsData()
      .then((data) => {
        if (!isActive) return;

        setAnnouncements(data);
        setError("");
      })
      .catch((err) => {
        if (!isActive) return;

        setError(
          err.response?.data?.message ||
            "Unable to load announcements. Please try again.",
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

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return announcements;

    return announcements.filter((item) => {
      const searchableText = [
        item.subject,
        item.content,
        item.category,
        item.createdBy?.name,
        item.schoolClass?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [announcements, search]);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout title="Announcements">
      <Box sx={{ maxWidth: 1000, mx: "auto", pb: 5 }}>
        {/* Heading */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2.5,
            mb: 4,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "text.primary",
                lineHeight: 1.3,
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              Announcements
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                lineHeight: 1.5,
              }}
            >
              Important updates and information from your school.
            </Typography>
          </Box>

          <IconButton
            onClick={fetchAnnouncements}
            disabled={loading}
            aria-label="Refresh announcements"
            sx={{
              flexShrink: 0,
              width: 40,
              height: 40,
              border: 1,
              borderColor: "divider",
            }}
          >
            <RefreshRoundedIcon />
          </IconButton>
        </Stack>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search announcements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3.5 }}
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
              py: 8,
            }}
          >
            <CircularProgress />
          </Box>
        ) : filteredAnnouncements.length === 0 ? (
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              bgcolor: "background.paper",
              backgroundImage: "none",
              borderColor: "divider",
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                py: 7,
                px: 2,
                "&:last-child": { pb: 7 },
              }}
            >
              <CampaignOutlinedIcon
                sx={{
                  fontSize: 42,
                  color: "text.secondary",
                  mb: 1.5,
                }}
              />

              <Typography
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                }}
              >
                No announcements found
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: 0.75,
                }}
              >
                {search
                  ? "Try a different search term."
                  : "Your school announcements will appear here."}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2.5}>
            {filteredAnnouncements.map((item) => (
              <Card
                key={item._id}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  backgroundImage: "none",
                  borderColor: "divider",
                  transition: "border-color 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
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
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: "flex-start" }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "action.selected",
                        color: "primary.main",
                        width: 42,
                        height: 42,
                        flexShrink: 0,
                      }}
                    >
                      <CampaignOutlinedIcon />
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        sx={{
                          justifyContent: "space-between",
                          alignItems: { xs: "flex-start", sm: "center" },
                          gap: 1.25,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 750,
                            fontSize: "1.1rem",
                            lineHeight: 1.4,
                            color: "text.primary",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {item.subject}
                        </Typography>

                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ flexShrink: 0 }}
                          label={
                            categoryLabels[item.category] || "Announcement"
                          }
                        />
                      </Stack>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          mt: 1.5,
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {item.content}
                      </Typography>

                      <Divider sx={{ my: 2.5 }} />

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
                          <SchoolOutlinedIcon fontSize="small" color="action" />

                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {item.schoolClass?.name || "School"}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          From: {item.createdBy?.name || "School"}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{ alignItems: "center" }}
                        >
                          <CalendarTodayOutlinedIcon
                            fontSize="small"
                            color="action"
                          />

                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {formatDate(item.createdAt)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default StudentAnnouncements;
