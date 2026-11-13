
export const RpIcon = ({ className = "w-6 h-6", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Huruf R */}
    <path d="M4 6h4.5a3 3 0 0 1 0 6H4z" />
    <path d="M4 6v12" />
    <path d="M8.5 12 11 18" />
    
    {/* Huruf p */}
    <path d="M14 10h3.5a3 3 0 0 1 0 6H14z" />
    <path d="M14 10v9" />
  </svg>
);
