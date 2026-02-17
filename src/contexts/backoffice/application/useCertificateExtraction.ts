import { useState } from 'react';
import type { CertificateClient } from '../domain/CertificateClient';
import { ForgeCertificateExtractor } from '../infrastructure/ForgeCertificateExtractor';

// Switch to Forge implementation
const client: CertificateClient = new ForgeCertificateExtractor();

export const useCertificateExtraction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const extract = async (file: File, password: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const { blob, filename } = await client.extractPem(file, password);
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to extract certificate');
    } finally {
      setLoading(false);
    }
  };

  return { extract, loading, error, success };
};
