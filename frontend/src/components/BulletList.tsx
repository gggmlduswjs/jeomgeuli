import React from 'react'
import TTSButton from './TTSButton'

interface BulletListProps {
  bullets: string[]
  className?: string
}

const BulletList = ({ bullets, className = '' }: BulletListProps) => {
  if (!bullets || bullets.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {bullets.map((bullet, index) => (
        <div 
          key={index}
          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
        >
          <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
          <p className="text-gray-700 leading-relaxed flex-1">
            {bullet}
          </p>
          <TTSButton text={bullet} size="sm" />
        </div>
      ))}
    </div>
  )
}

export default BulletList
