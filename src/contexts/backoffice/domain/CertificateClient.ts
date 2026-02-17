export interface CertificateClient {
  extractPem(file: File, password: string): Promise<{ blob: Blob; filename: string }>;
}
