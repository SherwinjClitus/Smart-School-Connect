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

        // Count unique students across all assigned classes.
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
      } catch (err) {
        setError("Unable to load your dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const statCards = [
    {
      title: "My Classes",
      value: stats.classes,
      icon: SchoolOutlinedIcon,
      color: "#1976D2",
      background: "#EAF2FF",
      border: "#C9DCFF",
    },
    {
      title: "Students",
      value: stats.students,
      icon: GroupsOutlinedIcon,
      color: "#00897B",
      background: "#E3F5F2",
      border: "#B8E5DC",
    },
    {
      title: "Homework",
      value: stats.homework,
      icon: MenuBookOutlinedIcon,
      color: "#ED8B00",
      background: "#FFF3DF",
      border: "#FFE0A8",
    },
    {
      title: "Announcements",
      value: stats.announcements,
      icon: CampaignOutlinedIcon,
      color: "#7B61A8",
      background: "#F1EAFF",
      border: "#DCCEFF",
    },
    {
      title: "Direct Messages",
      value: stats.conversations,
      icon: ForumOutlinedIcon,
      color: "#D45B70",
      background: "#FCECEF",
      border: "#F5C9D2",
    },
  ];

  const quickActions = [
    {
      title: "Manage Homework",
      description: "Create and manage student assignments.",
      icon: MenuBookOutlinedIcon,
      path: "/teacher/homework",
      color: "#1976D2",
      background: "#EAF2FF",
    },
    {
      title: "Announcements",
      description: "Share important updates with your classes.",
      icon: CampaignOutlinedIcon,
      path: "/teacher/messages",
      color: "#7B61A8",
      background: "#F1EAFF",
    },
    {
      title: "Direct Messages",
      description: "Communicate privately with parents.",
      icon: ForumOutlinedIcon,
      path: "/teacher/conversations",
      color: "#00897B",
      background: "#E3F5F2",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Teacher Overview">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
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
            color="#1E293B"
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
                  background: item.background,
                  border: `1px solid ${item.border}`,
                  borderRadius: 3,
                  minHeight: 150,
                  overflow: "hidden",
                  transition: "all 0.25s ease",

                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 25px rgba(25, 118, 210, 0.10)",
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
                  {/* Card Title */}
                  <Typography
                    color="text.secondary"
                    fontWeight={600}
                    variant="body2"
                  >
                    {item.title}
                  </Typography>

                  {/* Card Value */}
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    color="#263B53"
                    mt={2}
                  >
                    {item.value}
                  </Typography>

                  {/* Icon - Fixed at top right */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 24,
                      right: 24,
                      width: 58,
                      height: 58,
                      borderRadius: 3,
                      bgcolor: "#FFFFFF",
                      color: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.07)",
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
              background: "#F5F9FF",
              border: "1px solid #DCE9FA",
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
                    bgcolor: "#E1EDFF",
                    color: "#1976D2",
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
                    bgcolor: "#FFFFFF",
                    border: "1px dashed #CBDCF2",
                    borderRadius: 2.5,
                  }}
                >
                  <SchoolOutlinedIcon
                    sx={{
                      fontSize: 42,
                      color: "#94A3B8",
                      mb: 1,
                    }}
                  />

                  <Typography fontWeight={600}>
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
                        background: "#FFFFFF",
                        border: "1px solid #DCE9FA",
                        borderLeft: "4px solid #1976D2",
                        borderRadius: 2.5,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          background: "#EDF4FF",
                          transform: "translateY(-2px)",
                          boxShadow: "0 5px 15px rgba(25, 118, 210, 0.07)",
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
                          <Typography fontWeight={700} color="#263B53">
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
                            bgcolor: "#EAF2FF",
                            color: "#1976D2",
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
              background: "#FAFCFF",
              border: "1px solid #E0EAF5",
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
                        background: "#FFFFFF",
                        border: "1px solid #E5EAF1",
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
                          color="#263B53"
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
