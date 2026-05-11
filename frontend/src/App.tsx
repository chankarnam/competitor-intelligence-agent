import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Results from './pages/Results'
import History from './pages/History'

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </div>
  )
}
