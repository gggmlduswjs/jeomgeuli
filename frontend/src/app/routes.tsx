import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import Explore from '../pages/Explore'
import Learn from '../pages/Learn'
import Review from '../pages/Review'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/review" element={<Review />} />
    </Routes>
  )
}
