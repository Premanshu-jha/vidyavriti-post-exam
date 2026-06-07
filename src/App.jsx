import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout'; 
import Login from './components/Login'; // Import your new Login component
import ProtectedRoute from './components/ProtectedRoute'; // Import the wrapper we just made

import StudentList from './components/StudentList';
import StudentReport from './components/StudentReport';
import UploadExamResults from './components/UploadExamResults';
import DocumentViewer from './components/DocumentViewer';
import ChatStreaming from './components/ChatStreaming';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* PUBLIC ROUTE: No Sidebar, No authentication required */}
        <Route path="/login" element={<Login />} />

        {/* DEFAULT REDIRECT: Send root traffic to the dashboard (or login if not authenticated) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* PROTECTED ROUTES: Everything inside here requires a token and gets the Sidebar! */}
        <Route element={
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        }>
          
          {/* Note: I changed "/" to "/dashboard" to separate the root from the app logic, 
              but you can name these paths whatever you prefer! */}
          <Route path="/dashboard" element={<StudentList />} />
          <Route path="/student/:id/report" element={<StudentReport />} />
          <Route path="/upload" element={<UploadExamResults />} />
          <Route path="/documents" element={<DocumentViewer />} />
          <Route path="/chat" element={<ChatStreaming />} />
          
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;