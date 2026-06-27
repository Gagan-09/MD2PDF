import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const Mermaid = ({ chart }) => {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        setError(null);
        if (chart) {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          if (isMounted) {
            setSvgContent(svg);
          }
        }
      } catch (e) {
        if (isMounted) {
          setError(e.message || 'Error rendering Mermaid chart');
          console.error('Mermaid rendering error:', e);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="mermaid-container" style={{ color: 'red', fontSize: '0.875rem' }}>
        <strong>Mermaid Error:</strong> {error}
      </div>
    );
  }

  return (
    <div 
      className="mermaid-container"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svgContent }} 
    />
  );
};

export default Mermaid;
