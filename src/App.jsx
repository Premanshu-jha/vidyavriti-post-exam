import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StudentList from './components/StudentList';
import StudentReport from './components/StudentReport';

function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<StudentList />} />
        <Route path="/student/:id/report" element={<StudentReport />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;