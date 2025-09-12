import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import Explore from '../pages/Explore'
import Learn from '../pages/Learn'
import Review from '../pages/Review'
import HeaderBar from '../components/HeaderBar'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/review" element={<Review />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
