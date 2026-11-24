
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";

import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";

import TeacherHomework from "./pages/TeacherHomework";
import StudentHomework from "./pages/StudentHomework";
import ParentHomework from "./pages/ParentHomework";

import ProtectedRoute from "./components/layout/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Student routes */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route
          path="/student/dashboard"
          element={<StudentDashboard />}
        />
        <Route
          path="/student/homework"
          element={<StudentHomework />}
        />
      </Route>

      {/* Teacher routes */}
      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route
          path="/teacher/dashboard"
          element={<TeacherDashboard />}
        />
        <Route
          path="/teacher/homework"
          element={<TeacherHomework />}
        />
      </Route>

      {/* Parent routes */}
      <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
        <Route
          path="/parent/dashboard"
          element={<ParentDashboard />}
        />
        <Route
          path="/parent/homework"
          element={<ParentHomework />}
        />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
