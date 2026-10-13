import { Leaf } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type TransitionValue = {
  play: (midpointAction?: () => void | Promise<void>) => Promise<void>;
};

const TransitionContext = createContext<TransitionValue>({ play: async (action) => { await action?.(); } });

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [transitionId, setTransitionId] = useState(0);
  const [visible, setVisible] = useState(false);
  const active = useRef(false);

  const play = useCallback(async (midpointAction?: () => void | Promise<void>) => {
    if (active.current) return;
    active.current = true;
    setTransitionId((current) => current + 1);
    setVisible(true);
    try {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 1500));
      await midpointAction?.();
      await new Promise<void>((resolve) => window.setTimeout(resolve, 1500));
    } finally {
      setVisible(false);
      active.current = false;
    }
  }, []);

  return <TransitionContext.Provider value={{ play }}>{children}{visible && <div key={transitionId} className="auth-transition" aria-hidden="true"><Leaf /></div>}</TransitionContext.Provider>;
}

export const useTransition = () => useContext(TransitionContext);
