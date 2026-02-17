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
          
          const formatAttributes = (attributes: any) => {
            if (!attributes || Object.keys(attributes).length === 0) return '';
            
            let output = 'Bag Attributes\n';
            
            // Helper to format hex string
            const toHex = (str: string) => {
                let hex = '';
                for(let i = 0; i < str.length; i++) {
                    const byte = str.charCodeAt(i).toString(16).toUpperCase();
                    hex += (byte.length < 2 ? '0' : '') + byte + ' '; 
                }
                return hex.trim();
            };

            if (attributes.localKeyId) {
                // localKeyId in forge is usually an array of strings (bytes)
                const localKeyId = attributes.localKeyId[0];
                output += `    localKeyID: ${toHex(localKeyId)}\n`;
            }
            
            if (attributes.friendlyName) {
                const friendlyName = attributes.friendlyName[0];
                output += `    friendlyName: ${friendlyName}\n`;
            }

            return output;
          };

          let pem = '';

          // Add keys
          const keyBagType = forge.pki.oids.pkcs8ShroudedKeyBag;
          if (keyBags && keyBags[keyBagType]) {
             const bags = keyBags[keyBagType];
             if (bags) {
                bags.forEach((bag) => {
                  if (bag.key) {
                    pem += formatAttributes(bag.attributes);
                    pem += 'Key Attributes: <No Attributes>\n';
                    pem += forge.pki.privateKeyToPem(bag.key);
                  }
                });
             }
          }

          // Add Certificates
           const certBagType = forge.pki.oids.certBag;
           if (bags && bags[certBagType]) {
            const certBags = bags[certBagType];
            if (certBags) {
                certBags.forEach((bag) => {
                  if (bag.cert) {
                    pem += formatAttributes(bag.attributes);
                    
                    // Add subject and issuer as comments
                    const subject = bag.cert.subject.attributes.map(attr => `/${attr.shortName}=${attr.value}`).join('');
                    const issuer = bag.cert.issuer.attributes.map(attr => `/${attr.shortName}=${attr.value}`).join('');
                    
                    pem += `subject=${subject}\n`;
                    pem += `issuer=${issuer}\n`;
                    
                    pem += forge.pki.certificateToPem(bag.cert);
                  }
                });
            }
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
