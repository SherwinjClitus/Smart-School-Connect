import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";

function StudentDashboard() {
  const navigate = useNavigate();

  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const response = await api.get("/homework/student");
        setHomework(response.data.homework || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load homework");
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, []);

  const completedCount = homework.filter(
    (task) => task.status === "completed",
  ).length;

  const pendingCount = homework.filter(
    (task) => task.status === "pending",
  ).length;

  const totalCount = homework.length;

  return (
    <DashboardLayout title="Student Overview">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Welcome back!
        </Typography>

        <Typography color="text.secondary">
          Here's an overview of your schoolwork.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">
                    Total Assignments
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {totalCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Pending</Typography>
                  <Typography
                    variant="h3"
                    fontWeight={700}
                    color="warning.main"
                  >
                    {pendingCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Completed</Typography>
                  <Typography
                    variant="h3"
                    fontWeight={700}
                    color="success.main"
                  >
                    {completedCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Recent Homework
                </Typography>

                <Button
                  variant="outlined"
                  onClick={() => navigate("/student/homework")}
                >
                  View All
                </Button>
              </Stack>

              {homework.length === 0 ? (
                <Typography color="text.secondary">
                  No homework assigned yet.
                </Typography>
              ) : (
                homework.slice(0, 3).map((task) => (
                  <Box
                    key={task._id}
                    sx={{
                      py: 2,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      gap={1}
                    >
                      <Box>
                        <Typography fontWeight={600}>{task.title}</Typography>

                        <Typography variant="body2" color="text.secondary">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                      </Box>

                      <Chip
                        label={task.status}
                        color={
                          task.status === "completed" ? "success" : "warning"
                        }
                      />
                    </Stack>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => navigate("/student/homework")}
            >
              Go to My Homework
            </Button>
          </Box>
        </>
      )}
    </DashboardLayout>
  );
}

export default StudentDashboard;
