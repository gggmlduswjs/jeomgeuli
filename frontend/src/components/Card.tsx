import React from 'react'
import { ExternalLink } from 'lucide-react'
import TTSButton from './TTSButton'

interface CardProps {
  title: string
  oneLine: string
  url?: string
  className?: string
}

const Card = ({ title, oneLine, url, className = '' }: CardProps) => {
  const handleCardClick = () => {
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const fullText = `${title}. ${oneLine}`

  return (
    <div 
      className={`card hover:shadow-md transition-shadow duration-200 cursor-pointer ${className}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      aria-label={`${title} - ${oneLine}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {oneLine}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <TTSButton text={fullText} size="sm" />
          {url && url !== '#' && (
            <ExternalLink 
              size={20} 
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200" 
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Card
