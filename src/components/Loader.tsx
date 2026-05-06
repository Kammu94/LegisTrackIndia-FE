import { Scale } from 'lucide-react';

type LoaderProps = {
  visible: boolean;
};

const Loader = ({ visible }: LoaderProps) => {
  if (!visible) return null;

  return (
    <div className="loader-overlay" role="status" aria-live="polite" aria-label="Loading">
      <Scale className="loader-logo text-legal-gold" aria-hidden="true" />
    </div>
  );
};

export default Loader;
