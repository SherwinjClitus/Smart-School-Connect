
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";

import api from "../services/api";

function TeacherHomework() {
  const [classes, setClasses] = useState([]);
  const [homework, setHomework] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [classId, setClassId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [classResponse, homeworkResponse] = await Promise.all([
        api.get("/classes/my-classes"),
        api.get("/homework/teacher"),
      ]);

      setClasses(classResponse.data.classes);
      setHomework(homeworkResponse.data.homework);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load homework data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateHomework(event) {
    event.preventDefault();

    if (!title.trim() || !description.trim() || !dueDate || !classId) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/homework", {
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        classId,
      });

      setTitle("");
      setDescription("");
      setDueDate("");
      setClassId("");

      setSuccess("Homework created successfully.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create homework."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Homework Management
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Create homework and assign it to your classes.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Create Homework
          </Typography>

          <Box component="form" onSubmit={handleCreateHomework}>
            <Stack spacing={2}>
              <TextField
                label="Homework title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
              />

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                fullWidth
                required
              />

              <TextField
                select
                label="Select class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                fullWidth
                required
              >
                {classes.map((schoolClass) => (
                  <MenuItem key={schoolClass._id} value={schoolClass._id}>
                    {schoolClass.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Due date"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />

              <Button
                type="submit"
                variant="contained"
                disabled={saving || classes.length === 0}
              >
                {saving ? "Creating..." : "Create Homework"}
              </Button>

              {classes.length === 0 && (
                <Alert severity="info">
                  Create a class before assigning homework.
                </Alert>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom>
        My Homework
      </Typography>

      {homework.length === 0 ? (
        <Typography color="text.secondary">
          You haven't created any homework yet.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {homework.map((task) => (
            <Card key={task._id}>
              <CardContent>
                <Typography variant="h6">{task.title}</Typography>

                <Typography sx={{ my: 1 }}>
                  {task.description}
                </Typography>

                <Typography color="text.secondary">
                  Class: {task.schoolClass?.name || "Unknown"}
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
  );
}

export default TeacherHomework;
