// import React from "react"; // Not needed in React 17+

interface BigButtonProps {
  label: string;
  color?: 'primary' | 'accent';
  onClick: () => void;
}

export default function BigButton({ label, color = 'accent', onClick }: BigButtonProps) {
  const colorClasses = color === 'accent' 
    ? 'bg-accent text-primary' 
    : 'bg-primary text-white';
  
  return (
    <button
      onClick={onClick}
      className={`${colorClasses} btn shadow-lg hover:shadow-xl transition-all`}
    >
      {label}
    </button>
  );
}
