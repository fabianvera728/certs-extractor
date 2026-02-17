import type { CertificateClient } from '../domain/CertificateClient';
import forge from 'node-forge';

export class ForgeCertificateExtractor implements CertificateClient {
  async extractPem(file: File, password: string): Promise<{ blob: Blob; filename: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          // Convert ArrayBuffer to binary string for node-forge
          // Note: node-forge expects binary string for P12 parsing usually
          const p12Der = forge.util.createBuffer(arrayBuffer);
          const p12Asn1 = forge.asn1.fromDer(p12Der);
          
          // Parse PKCS#12
          const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

          // Get bags
          const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
          const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
          
          let pem = '';

          // Add keys
          if (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]) {
             keyBags[forge.pki.oids.pkcs8ShroudedKeyBag].forEach((bag) => {
               if (bag.key) {
                 pem += forge.pki.privateKeyToPem(bag.key);
               }
             });
          }

          // Add Certificates
           if (bags[forge.pki.oids.certBag]) {
            bags[forge.pki.oids.certBag].forEach((bag) => {
              if (bag.cert) {
                pem += forge.pki.certificateToPem(bag.cert);
              }
            });
          }
          
          const blob = new Blob([pem], { type: 'application/x-pem-file' });
          const filename = file.name.replace(/\.[^/.]+$/, "") + ".pem";

          resolve({ blob, filename });

        } catch (err: any) {
          console.error("Forge Extraction Error:", err);
          if (err.message && (err.message.includes('Invalid password') || err.message.includes('mac invalid'))) {
             reject(new Error('Invalid password or corrupted file.'));
          } else {
             reject(new Error('Failed to extract certificate. Please check the file and password.'));
          }
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }
}
