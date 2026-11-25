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

function ParentDashboard() {
  const navigate = useNavigate();

  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const response = await api.get("/homework/parent");
        setChildren(response.data.children || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load children's homework",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, []);

  const totalChildren = children.length;

  const allHomework = children.flatMap((child) => child.homework || []);

  const totalAssignments = allHomework.length;

  const completedCount = allHomework.filter(
    (task) => task.status === "completed",
  ).length;

  const pendingCount = allHomework.filter(
    (task) => task.status === "pending",
  ).length;

  return (
    <DashboardLayout title="Parent Overview">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Welcome back!
        </Typography>

        <Typography color="text.secondary">
          Keep track of your children's school progress.
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
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">My Children</Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {totalChildren}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">
                    Total Assignments
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {totalAssignments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
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

            <Grid item xs={12} sm={6} md={3}>
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
                  Children's Overview
                </Typography>

                <Button
                  variant="outlined"
                  onClick={() => navigate("/parent/homework")}
                >
                  View All
                </Button>
              </Stack>

              {children.length === 0 ? (
                <Typography color="text.secondary">
                  No linked children found.
                </Typography>
              ) : (
                children.map((child) => (
                  <Box
                    key={child.studentId}
                    sx={{
                      py: 2,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <Typography fontWeight={700}>
                      {child.studentName}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {child.homework?.length || 0} assignments
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={`${
                          child.homework?.filter(
                            (task) => task.status === "completed",
                          ).length || 0
                        } Completed`}
                        color="success"
                      />

                      <Chip
                        size="small"
                        label={`${
                          child.homework?.filter(
                            (task) => task.status === "pending",
                          ).length || 0
                        } Pending`}
                        color="warning"
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
              onClick={() => navigate("/parent/homework")}
            >
              View Children's Homework
            </Button>
          </Box>
        </>
      )}
    </DashboardLayout>
  );
}

export default ParentDashboard;
