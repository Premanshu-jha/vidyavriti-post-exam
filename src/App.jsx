import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout'; // Import our new Layout wrapper
import StudentList from './components/StudentList';
import StudentReport from './components/StudentReport';
import UploadExamResults from './components/UploadExamResults';
import DocumentViewer from './components/DocumentViewer';
import ChatStreaming from './components/ChatStreaming';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Everything inside this block gets the Sidebar! */}
        <Route element={<Layout />}>
          
          <Route path="/" element={<StudentList />} />
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