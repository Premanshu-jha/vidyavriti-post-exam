import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout'; 
import Login from './components/Login'; 
import ProtectedRoute from './components/ProtectedRoute'; 
import RoleBasedRedirect from './components/RoleBasedRedirect';
import StudentList from './components/StudentList';
import StudentReport from './components/StudentReport';
import Leaderboard from './components/Leaderboard';
import UploadExamResults from './components/UploadExamResults';
import DocumentViewer from './components/DocumentViewer';
import ChatStreaming from './components/ChatStreaming';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<RoleBasedRedirect />} />

        <Route element={
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        }>
          
          <Route path="/directory" element={<StudentList />} />
          <Route path="/student/:id/report" element={<StudentReport />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/upload" element={<UploadExamResults />} />
          <Route path="/documents" element={<DocumentViewer />} />
          <Route path="/chat" element={<ChatStreaming />} />
          
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;