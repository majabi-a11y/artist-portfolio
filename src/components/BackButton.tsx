import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ label = 'Retour' }: { label?: string }) {
  const navigate = useNavigate();

  return (
    <button
      className="back-btn"
      onClick={() => navigate('/')}
      aria-label={label}
    >
      <ArrowLeft size={16} />
      <span>{label}</span>
    </button>
  );
}
