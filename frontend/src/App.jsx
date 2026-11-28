import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";

import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";

import TeacherHomework from "./pages/TeacherHomework";
import StudentHomework from "./pages/StudentHomework";
import ParentHomework from "./pages/ParentHomework";
import TeacherHomeworkSubmissions from "./pages/TeacherHomeworkSubmissions";

import TeacherMessages from "./pages/TeacherMessages";
import ParentMessages from "./pages/ParentMessages";

import ParentInbox from "./features/conversations/pages/ParentInbox";
import TeacherInbox from "./features/conversations/pages/TeacherInbox";
import ConversationDetails from "./features/conversations/pages/ConversationDetails";
import NewConversation from "./features/conversations/pages/NewConversation";
import TeacherNewConversation from "./features/conversations/pages/TeacherNewConversation";
import StudentAnnouncements from "./pages/StudentAnnouncements";

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
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/homework" element={<StudentHomework />} />
        <Route
          path="/student/announcements"
          element={<StudentAnnouncements />}
        />
      </Route>

      {/* Teacher routes */}
      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/homework" element={<TeacherHomework />} />

        <Route
          path="/teacher/homework/:homeworkId/submissions"
          element={<TeacherHomeworkSubmissions />}
        />

        <Route
          path="/teacher/conversations/new"
          element={<TeacherNewConversation />}
        />

        {/* Class announcements */}
        <Route path="/teacher/messages" element={<TeacherMessages />} />

        {/* Parent-teacher direct conversations */}
        <Route path="/teacher/conversations" element={<TeacherInbox />} />

        <Route
          path="/teacher/conversations/:conversationId"
          element={<ConversationDetails />}
        />
      </Route>

      {/* Parent routes */}
      <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
        <Route path="/parent/homework" element={<ParentHomework />} />

        {/* Class announcements */}
        <Route path="/parent/messages" element={<ParentMessages />} />

        {/* Parent-teacher direct conversations */}
        <Route path="/parent/conversations" element={<ParentInbox />} />

        <Route path="/parent/conversations/new" element={<NewConversation />} />

        <Route
          path="/parent/conversations/:conversationId"
          element={<ConversationDetails />}
        />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
