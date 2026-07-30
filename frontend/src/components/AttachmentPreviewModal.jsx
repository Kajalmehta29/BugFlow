import React, { useEffect, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import './AttachmentPreviewModal.css';

export default function AttachmentPreviewModal({ attachment, onClose }) {
  const [src, setSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchAttachment = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
        const response = await fetch(`${baseUrl}/attachments/${attachment.id}/download`, {
          headers
        });
        
        if (!response.ok) throw new Error('Failed to load file content');
        
        const blob = await response.blob();
        if (active) {
          const correctedBlob = new Blob([blob], { type: attachment.fileType });
          const objectUrl = URL.createObjectURL(correctedBlob);
          setSrc(objectUrl);
        }
      } catch (err) {
        if (active) setError(err.message || 'Error loading file');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAttachment();

    return () => {
      active = false;
      if (src) {
        URL.revokeObjectURL(src);
      }
    };
  }, [attachment.id]);

  const handleDownload = () => {
    api.downloadAttachment(attachment.id, attachment.filename);
  };

  const isImage = attachment.fileType.startsWith('image/');
  const isPdf = attachment.fileType === 'application/pdf' || attachment.filename.toLowerCase().endsWith('.pdf');

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <div className="preview-title-info">
            <h3>{attachment.filename}</h3>
            <span className="preview-meta">{attachment.fileType}</span>
          </div>
          <div className="preview-actions">
            <button className="btn btn-secondary btn-icon" onClick={handleDownload} title="Download File">
              <Download size={16} />
              <span>Download</span>
            </button>
            <button className="btn-close" onClick={onClose} title="Close Preview">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="preview-body">
          {loading && (
            <div className="preview-loading">
              <Loader2 className="spinning" size={32} />
              <p>Fetching content...</p>
            </div>
          )}

          {error && (
            <div className="preview-error">
              <p>Failed to preview file: {error}</p>
              <button className="btn btn-primary" onClick={handleDownload}>
                <Download size={18} />
                Download to View
              </button>
            </div>
          )}

          {!loading && !error && src && (
            <div className="preview-viewport">
              {isImage ? (
                <img src={src} alt={attachment.filename} className="preview-image" />
              ) : isPdf ? (
                <object data={src} type="application/pdf" className="preview-pdf">
                  <iframe src={src} className="preview-pdf" title={attachment.filename}>
                    <p>This browser does not support PDF viewing. Please download the PDF to view it.</p>
                  </iframe>
                </object>
              ) : (
                <div className="preview-fallback">
                  <p>Preview is not supported for this file type.</p>
                  <button className="btn btn-primary" onClick={handleDownload}>
                    <Download size={18} />
                    Download File
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
