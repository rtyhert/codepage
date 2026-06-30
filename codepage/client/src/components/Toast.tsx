import { useEffect, useState } from 'react';

interface Props {
  msg: string;
  isError?: boolean;
  onDone: () => void;
}

export function Toast({ msg, isError, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: isError ? '#3a1a1a' : '#2a2a35', color: '#e1e1e6',
      padding: '10px 24px', borderRadius: 10, fontSize: 13, zIndex: 400,
      opacity: visible ? 1 : 0, transition: 'opacity .3s',
    }}>{msg}</div>
  );
}
