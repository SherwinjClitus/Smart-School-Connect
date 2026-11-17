import './App.css'
import { Routes,Route,Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ParentDashboard from './pages/ParentDashboard'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'


function App() {
  return (
    <>
    <Routes>
      <Route path='/' element={<Navigate to ="/login"/>}/>

      <Route path='/login' element={<Login/>}/>

      <Route path='/parent/dashboard' element={<ParentDashboard/>}/>

      <Route path='/student/dashboard' element={<StudentDashboard/>}/>

      <Route path='/teacher/dashboard' element={<TeacherDashboard/>}/>
    </Routes>

    </>
  )
}

export default App
