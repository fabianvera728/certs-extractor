import axios from 'axios';
import type { CertificateClient } from '../domain/CertificateClient';

export class HttpCertificateClient implements CertificateClient {
  async extractPem(file: File, password: string): Promise<{ blob: Blob; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    const response = await axios.post('http://localhost:3000/api/extract', formData, {
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'];
    let filename = 'certificate.pem';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    }

    return { blob: response.data, filename };
  }
}
