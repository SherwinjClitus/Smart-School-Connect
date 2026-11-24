
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";

import api from "../services/api";

function ParentHomework() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchChildrenHomework();
  }, []);

  async function fetchChildrenHomework() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/homework/parent");

      setChildren(response.data.children);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load children's homework."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Children's Homework
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Track homework assigned to your linked children.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {children.length === 0 && !error ? (
        <Alert severity="info">
          No linked children were found.
        </Alert>
      ) : (
        <Stack spacing={4}>
          {children.map((item) => (
            <Box key={item.child.id}>
              <Typography variant="h5" gutterBottom>
                {item.child.name}
              </Typography>

              {item.homework.length === 0 ? (
                <Typography color="text.secondary">
                  No homework assigned yet.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {item.homework.map((task) => (
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
                              task.status === "completed"
                                ? "success"
                                : "warning"
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
                          Teacher: {task.createdBy?.name || "Unknown"}
                        </Typography>

                        <Typography color="text.secondary">
                          Due: {new Date(task.dueDate).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default ParentHomework;
