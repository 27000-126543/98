import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import UploadPage from '@/pages/UploadPage'
import ComputePage from '@/pages/ComputePage'
import HistoryPage from '@/pages/HistoryPage'
import ResultPage from '@/pages/ResultPage'
import DashboardPage from '@/pages/DashboardPage'
import { useStore } from '@/store'
import { demoTasks } from '@/data/demoTasks'

export default function App() {
  const tasks = useStore(s => s.tasks)

  useEffect(() => {
    if (tasks.length === 0) {
      useStore.setState({ tasks: demoTasks })
    }
  }, [tasks.length])

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
