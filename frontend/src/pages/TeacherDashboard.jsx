import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";

import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";

function TeacherDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();

  const isDark = theme.palette.mode === "dark";

  const [stats, setStats] = useState({
    classes: 0,
    students: 0,
    homework: 0,
    announcements: 0,
    conversations: 0,
  });

  const [classes, setClasses] = useState([]);
  const [teacherName, setTeacherName] = useState("Teacher");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        let user = null;

        try {
          user = JSON.parse(localStorage.getItem("user") || "null");
        } catch {
          user = null;
        }

        setTeacherName(user?.name || "Teacher");

        const results = await Promise.allSettled([
          api.get("/classes/my-classes"),
          api.get("/homework/teacher"),
          api.get("/messages/teacher"),
          api.get("/conversations"),
        ]);

        const [
          classResult,
          homeworkResult,
          announcementResult,
          conversationResult,
        ] = results;

        const getData = (result) =>
          result.status === "fulfilled" ? result.value.data : {};

        const classData = getData(classResult);
        const homeworkData = getData(homeworkResult);
        const announcementData = getData(announcementResult);
        const conversationData = getData(conversationResult);

        const classList = Array.isArray(classData.classes)
          ? classData.classes
          : [];

        const homeworkList = Array.isArray(homeworkData.homework)
          ? homeworkData.homework
          : [];

        const announcementList = Array.isArray(announcementData.messages)
          ? announcementData.messages
          : [];

        const conversationList = Array.isArray(conversationData.conversations)
          ? conversationData.conversations
          : [];

        // Count unique students across assigned classes.
        const studentIds = new Set();

        classList.forEach((schoolClass) => {
          (schoolClass.students || []).forEach((student) => {
            const studentId = student._id || student.id;

            if (studentId) {
              studentIds.add(String(studentId));
            }
          });
        });

        setClasses(classList);

        setStats({
          classes: classData.count ?? classList.length,
          students: studentIds.size,
          homework: homeworkData.count ?? homeworkList.length,
          announcements: announcementData.count ?? announcementList.length,
          conversations: conversationData.count ?? conversationList.length,
        });

        if (results.some((result) => result.status === "rejected")) {
          setError(
            "Some dashboard information could not be loaded. Please try refreshing.",
          );
        }
      } catch {
        setError("Unable to load your dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Theme-aware statistic card colors.
  const statCards = [
    {
      title: "My Classes",
      value: stats.classes,
      icon: SchoolOutlinedIcon,
      color: isDark ? "#93C5FD" : "#1976D2",
      background: isDark ? "#1E3553" : "#EAF2FF",
      border: isDark ? "#304D70" : "#C9DCFF",
    },
    {
      title: "Students",
      value: stats.students,
      icon: GroupsOutlinedIcon,
      color: isDark ? "#6EE7D8" : "#00897B",
      background: isDark ? "#193D3A" : "#E3F5F2",
      border: isDark ? "#285B53" : "#B8E5DC",
    },
    {
      title: "Homework",
      value: stats.homework,
      icon: MenuBookOutlinedIcon,
      color: isDark ? "#FBBF65" : "#ED8B00",
      background: isDark ? "#46351F" : "#FFF3DF",
      border: isDark ? "#69502D" : "#FFE0A8",
    },
    {
      title: "Announcements",
      value: stats.announcements,
      icon: CampaignOutlinedIcon,
      color: isDark ? "#C4A7FF" : "#7B61A8",
      background: isDark ? "#35294D" : "#F1EAFF",
      border: isDark ? "#514071" : "#DCCEFF",
    },
    {
      title: "Direct Messages",
      value: stats.conversations,
      icon: ForumOutlinedIcon,
      color: isDark ? "#FDA4B4" : "#D45B70",
      background: isDark ? "#472B36" : "#FCECEF",
      border: isDark ? "#68404D" : "#F5C9D2",
    },
  ];

  const quickActions = [
    {
      title: "Manage Homework",
      description: "Create and manage student assignments.",
      icon: MenuBookOutlinedIcon,
      path: "/teacher/homework",
      color: isDark ? "#93C5FD" : "#1976D2",
      background: isDark ? "#1E3553" : "#EAF2FF",
    },
    {
      title: "Announcements",
      description: "Share important updates with your classes.",
      icon: CampaignOutlinedIcon,
      path: "/teacher/messages",
      color: isDark ? "#C4A7FF" : "#7B61A8",
      background: isDark ? "#35294D" : "#F1EAFF",
    },
    {
      title: "Direct Messages",
      description: "Communicate privately with parents.",
      icon: ForumOutlinedIcon,
      path: "/teacher/conversations",
      color: isDark ? "#6EE7D8" : "#00897B",
      background: isDark ? "#193D3A" : "#E3F5F2",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Teacher Overview">
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teacher Overview">
      <Box sx={{ maxWidth: 1250, mx: "auto" }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight={800}
            letterSpacing="-0.7px"
            color="text.primary"
            mb={1}
          >
            Welcome back, {teacherName}!
          </Typography>

          <Typography color="text.secondary">
            Here's an overview of your classes and teaching activities.
          </Typography>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
              xl: "repeat(5, 1fr)",
            },
            gap: 2.5,
            mb: 4,
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
                  bgcolor: item.background,
                  border: `1px solid ${item.border}`,
                  borderRadius: 3,
                  minHeight: 150,
                  overflow: "hidden",
                  transition: "all 0.25s ease",

                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: isDark
                      ? "0 10px 25px rgba(0,0,0,0.2)"
                      : "0 10px 25px rgba(25,118,210,0.10)",
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: 3,
                    height: "100%",
                    "&:last-child": {
                      pb: 3,
                    },
                  }}
                >
                  <Typography
                    color={isDark ? "#CBD5E1" : "#64748B"}
                    fontWeight={600}
                    variant="body2"
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    variant="h3"
                    fontWeight={800}
                    color={isDark ? "#F1F5F9" : "#263B53"}
                    mt={2}
                  >
                    {item.value}
                  </Typography>

                  {/* Statistic Icon */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 24,
                      right: 24,
                      width: 58,
                      height: 58,
                      borderRadius: 3,
                      bgcolor: isDark ? "#263447" : "#FFFFFF",
                      color: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isDark
                        ? "0 4px 12px rgba(0,0,0,0.18)"
                        : "0 4px 12px rgba(15,23,42,0.07)",
                    }}
                  >
                    <Icon sx={{ fontSize: 29 }} />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Main Dashboard Content */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1.2fr 0.8fr",
            },
            gap: 3,
          }}
        >
          {/* My Classes */}
          <Card
            elevation={0}
            sx={{
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2.5,
                    bgcolor: isDark ? "#1E3553" : "#E1EDFF",
                    color: isDark ? "#93C5FD" : "#1976D2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ClassOutlinedIcon />
                </Box>

                <Typography variant="h6" fontWeight={700}>
                  My Classes
                </Typography>
              </Stack>

              <Typography color="text.secondary" variant="body2" mb={3}>
                Overview of the classes assigned to you.
              </Typography>

              {classes.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 5,
                    bgcolor: "action.hover",
                    border: 1,
                    borderStyle: "dashed",
                    borderColor: "divider",
                    borderRadius: 2.5,
                  }}
                >
                  <SchoolOutlinedIcon
                    sx={{
                      fontSize: 42,
                      color: "text.secondary",
                      mb: 1,
                    }}
                  />

                  <Typography fontWeight={600} color="text.primary">
                    No classes assigned yet
                  </Typography>

                  <Typography color="text.secondary" variant="body2" mt={0.5}>
                    Your assigned classes will appear here.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {classes.map((schoolClass) => (
                    <Box
                      key={schoolClass._id}
                      sx={{
                        p: 2.5,
                        bgcolor: isDark ? "#202D3D" : "#FFFFFF",
                        border: 1,
                        borderColor: "divider",
                        borderLeft: `4px solid ${
                          isDark ? "#60A5FA" : "#1976D2"
                        }`,
                        borderRadius: 2.5,
                        transition: "all 0.2s ease",

                        "&:hover": {
                          bgcolor: isDark ? "#26374A" : "#EDF4FF",
                          transform: "translateY(-2px)",
                          boxShadow: isDark
                            ? "0 5px 15px rgba(0,0,0,0.18)"
                            : "0 5px 15px rgba(25,118,210,0.07)",
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        flexWrap="wrap"
                        gap={2}
                      >
                        <Box>
                          <Typography fontWeight={700} color="text.primary">
                            {schoolClass.name}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            mt={0.5}
                          >
                            Grade {schoolClass.grade} · Section{" "}
                            {schoolClass.section}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            bgcolor: isDark ? "#263D5B" : "#EAF2FF",
                            color: isDark ? "#93C5FD" : "#1976D2",
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="caption" fontWeight={700}>
                            {schoolClass.students?.length || 0} Students
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card
            elevation={0}
            sx={{
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={1}>
                Quick Actions
              </Typography>

              <Typography color="text.secondary" variant="body2" mb={3}>
                Access your frequently used features.
              </Typography>

              <Stack spacing={1.5}>
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Button
                      key={action.title}
                      onClick={() => navigate(action.path)}
                      fullWidth
                      sx={{
                        justifyContent: "flex-start",
                        textAlign: "left",
                        textTransform: "none",
                        p: 1.5,
                        borderRadius: 2.5,
                        color: "text.primary",
                        bgcolor: isDark ? "#202D3D" : "#FFFFFF",
                        border: 1,
                        borderColor: "divider",
                        transition: "all 0.2s ease",

                        "&:hover": {
                          bgcolor: action.background,
                          borderColor: action.color,
                          transform: "translateX(3px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 46,
                          height: 46,
                          borderRadius: 2.5,
                          bgcolor: action.background,
                          color: action.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mr: 1.5,
                          flexShrink: 0,
                        }}
                      >
                        <Icon />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          fontWeight={700}
                          fontSize="0.9rem"
                          color="text.primary"
                        >
                          {action.title}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "block",
                            whiteSpace: "normal",
                            lineHeight: 1.5,
                          }}
                        >
                          {action.description}
                        </Typography>
                      </Box>

                      <ArrowForwardRoundedIcon
                        fontSize="small"
                        sx={{
                          color: action.color,
                          ml: 1,
                          flexShrink: 0,
                        }}
                      />
                    </Button>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </DashboardLayout>
  );
}

export default TeacherDashboard;
