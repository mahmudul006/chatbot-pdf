import React, { useRef, useEffect, ReactNode } from 'react';

interface ScrollToTopOnNewContentProps {
  children: ReactNode;
}

const ScrollToTopOnNewContent: React.FC<ScrollToTopOnNewContentProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the top when children change
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [children]);

  return (
    <div ref={containerRef} style={{ overflowY: 'auto' }}>
      {children}
    </div>
  );
};

export default ScrollToTopOnNewContent;
