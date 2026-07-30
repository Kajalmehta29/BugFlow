import React, { useEffect, useState } from 'react';

export default function AuthenticatedImage({ attachmentId, alt, className, style }) {
  const [src, setSrc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
        const response = await fetch(`${baseUrl}/attachments/${attachmentId}/download`, {
          headers
        });
        
        if (!response.ok) throw new Error('Failed to load image');
        
        const blob = await response.blob();
        if (active) {
          const objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        }
      } catch (err) {
        console.error('Error loading authenticated image:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      active = false;
      if (src) {
        URL.revokeObjectURL(src);
      }
    };
  }, [attachmentId]);

  if (loading) {
    return <div className="image-placeholder animate-pulse" style={{ height: '120px', background: 'var(--bg-hover)', borderRadius: '12px 12px 0 0', ...style }} />;
  }

  if (!src) return null;

  return <img src={src} alt={alt} className={className} style={style} />;
}
