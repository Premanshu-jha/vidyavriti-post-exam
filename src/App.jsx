import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout'; 
import Login from './components/Login'; 
import ProtectedRoute from './components/ProtectedRoute'; 

// Component Imports
import StudentList from './components/StudentList';
import StudentReport from './components/StudentReport';
import Leaderboard from './components/Leaderboard'; // <-- IMPORTED HERE
import UploadExamResults from './components/UploadExamResults';
import DocumentViewer from './components/DocumentViewer';
import ChatStreaming from './components/ChatStreaming';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* PUBLIC ROUTE: No Sidebar, No authentication required */}
        <Route path="/login" element={<Login />} />

        {/* DEFAULT REDIRECT: Send root traffic to the dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* PROTECTED ROUTES: Everything inside here requires a token and gets the Sidebar! */}
        <Route element={
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        }>
          
          <Route path="/dashboard" element={<StudentList />} />
          <Route path="/student/:id/report" element={<StudentReport />} />
          
          {/* <-- ADDED LEADERBOARD ROUTE HERE --> */}
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