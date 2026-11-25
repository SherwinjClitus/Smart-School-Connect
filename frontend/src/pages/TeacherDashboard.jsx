import { Typography, Grid, Card, CardContent, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";

function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Teacher Overview">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Welcome back!
        </Typography>
        <Typography color="text.secondary">
          Here's what's happening in your classroom.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">My Classes</Typography>
              <Typography variant="h4" fontWeight={700}>
                1
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Students</Typography>
              <Typography variant="h4" fontWeight={700}>
                1
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Homework</Typography>
              <Typography variant="h4" fontWeight={700}>
                2
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700}>
              Quick Actions
            </Typography>

            <Typography
              color="primary"
              sx={{ mt: 2, cursor: "pointer" }}
              onClick={() => navigate("/teacher/homework")}
            >
              Manage Homework →
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}

export default TeacherDashboard;
