import { Link, useLocation } from 'react-router-dom'
import { Home, Search, BookOpen, FileText } from 'lucide-react'
import BrailleToggle from './BrailleToggle'

const HeaderBar = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '홈', icon: Home },
    { path: '/explore', label: '정보탐색', icon: Search },
    { path: '/learn', label: '점자학습', icon: BookOpen },
    { path: '/review', label: '복습노트', icon: FileText },
  ]

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">점</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">점글이</h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700 font-medium' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  aria-label={item.label}
                >
                  <Icon size={20} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Braille Toggle */}
          <BrailleToggle />
        </div>
      </div>
    </header>
  )
}

export default HeaderBar
