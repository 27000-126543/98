import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import UploadPage from '@/pages/UploadPage'
import ComputePage from '@/pages/ComputePage'
import HistoryPage from '@/pages/HistoryPage'
import ResultPage from '@/pages/ResultPage'
import DashboardPage from '@/pages/DashboardPage'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/compute/:id" element={<ComputePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}
