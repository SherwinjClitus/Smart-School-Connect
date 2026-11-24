
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";

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
      </Route>

      {/* Teacher routes */}
      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route
          path="/teacher/dashboard"
          element={<TeacherDashboard />}
        />
      </Route>

      {/* Parent routes */}
      <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
        <Route
          path="/parent/dashboard"
          element={<ParentDashboard />}
        />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
