import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';
import { Download, FileText, Code2, Eye, X, Loader2, Upload } from 'lucide-react';
import Mermaid from './Mermaid';

const DEFAULT_MARKDOWN = `# Architecture Overview

This is a sample document demonstrating the conversion.

## System Flow

\`\`\`mermaid
graph TD
    Client[Client App / Web] -->|HTTPS / REST| LB[Load Balancer / API Gateway]

    LB --> App1[Spring Boot App Instance 1]
    LB --> App2[Spring Boot App Instance 2]

    subgraph "Core Banking Monolith"
        App1
        App2
    end

    App1 -->|JDBC| DB[(PostgreSQL Primary)]
    App2 -->|JDBC| DB
\`\`\`

## Data Details

| Component | Type |
|---|---|
| Postgres | Database |
| React | Frontend |
`;

const MarkdownComponents = {
  code: function CodeComponent({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : null;

    if (!inline && language === 'mermaid') {
      return <Mermaid chart={String(children).replace(/\n$/, '')} />;
    }

    return !inline ? (
      <pre className={className} {...props}>
        <code>{children}</code>
      </pre>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};

function App() {
  console.log("App loaded");
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState('document.pdf');
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  const getPdfOptions = () => ({
    margin:       [20, 15, 20, 15],
    filename:     fileName,
    image:        { type: 'jpeg', quality: 0.95 },
    html2canvas:  { scale: 1.5, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
  });

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Use the uploaded file's name for the PDF output
    const newFileName = file.name.replace(/\.md$/i, '') + '.pdf';
    setFileName(newFileName);

    const reader = new FileReader();
    reader.onload = (e) => {
      setMarkdown(e.target.result);
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be uploaded again if needed
    event.target.value = null;
  };

  const handlePreviewPDF = () => {
    const element = previewRef.current;
    if (!element) return;
    
    setIsGenerating(true);
    
    // Generate blob URL using html2pdf promise API
    html2pdf()
      .set(getPdfOptions())
      .from(element)
      .outputPdf('bloburl')
      .then((url) => {
        setPdfBlobUrl(url);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error("PDF generation error", err);
        setIsGenerating(false);
      });
  };

  const handleDownloadPDF = () => {
    if (!pdfBlobUrl) return;
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closePreview = () => {
    setPdfBlobUrl(null);
  };

  return (
    <div className="app-container">
      <header className="header glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={`${import.meta.env.BASE_URL}hp_logo.png`} alt="MD2PDF Logo" style={{ height: '32px', width: 'auto' }} />
          <h1>MD2PDF</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            type="file" 
            accept=".md" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button 
            className="btn btn-secondary" 
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} /> Upload .md
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handlePreviewPDF}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
            {isGenerating ? 'Generating...' : 'Preview PDF'}
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="pane glass">
          <div className="pane-header">
            <Code2 size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            Markdown Editor
          </div>
          <textarea
            className="editor-textarea"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck="false"
          />
        </section>

        <section className="pane" style={{ background: '#f8fafc', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)' }}>
          <div className="pane-header" style={{ borderBottom: '1px solid #e2e8f0', background: '#e2e8f0', color: '#475569' }}>
            <FileText size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            Live HTML Preview
          </div>
          <div className="preview-container">
            <div className="markdown-body" ref={previewRef}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={MarkdownComponents}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </div>
        </section>
      </main>

      {/* PDF Preview Modal */}
      {pdfBlobUrl && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <FileText size={20} />
                PDF Preview
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={closePreview}>
                  <X size={16} /> Close
                </button>
                <button className="btn btn-primary" onClick={handleDownloadPDF}>
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>
            <iframe 
              src={pdfBlobUrl} 
              className="pdf-iframe" 
              title="PDF Preview"
            />
            <div className="mobile-pdf-fallback">
              <FileText size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <h3>PDF Preview Not Supported</h3>
              <p>Your mobile browser doesn't support inline PDF previews.</p>
              <p>Please use the Download button above to view your PDF.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
