
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";

import api from "../services/api";

function StudentHomework() {
  const [homework, setHomework] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHomework();
  }, []);

  async function fetchHomework() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/homework/student");

      setHomework(response.data.homework);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load homework."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(homeworkId) {
    try {
      setError("");

      await api.patch(`/homework/${homeworkId}/complete`);

      setHomework((previousHomework) =>
        previousHomework.map((task) =>
          task._id === homeworkId
            ? { ...task, status: "completed" }
            : task
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update homework."
      );
    }
  }

  const filteredHomework = homework.filter((task) => {
    if (filter === "pending") return task.status === "pending";
    if (filter === "completed") return task.status === "completed";
    return true;
  });

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Homework
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        View your assignments and track your progress.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs
        value={filter}
        onChange={(event, newValue) => setFilter(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="All" value="all" />
        <Tab label="Pending" value="pending" />
        <Tab label="Completed" value="completed" />
      </Tabs>

      {filteredHomework.length === 0 ? (
        <Typography color="text.secondary">
          No homework found in this category.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {filteredHomework.map((task) => (
            <Card key={task._id}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Typography variant="h6">
                    {task.title}
                  </Typography>

                  <Chip
                    label={task.status}
                    color={
                      task.status === "completed" ? "success" : "warning"
                    }
                  />
                </Stack>

                <Typography sx={{ mt: 2 }}>
                  {task.description}
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Class: {task.schoolClass?.name || "Unknown"}
                </Typography>

                <Typography color="text.secondary">
                  Due: {new Date(task.dueDate).toLocaleString()}
                </Typography>

                {task.status !== "completed" && (
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => handleComplete(task._id)}
                  >
                    Mark as Completed
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default StudentHomework;
