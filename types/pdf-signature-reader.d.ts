declare module 'pdf-signature-reader' {
  export interface CertInfo {
    clientCertificate: boolean;
    issuedBy: {
      commonName: string;
      organizationName: string;
      countryName: string;
    };
    issuedTo: {
      countryName: string;
      stateOrProvinceName?: string;
      organizationName?: string;
      commonName?: string;
    };
    validityPeriod: {
      notBefore: string;
      notAfter: string;
    };
    pemCertificate: string;
  }

  export function getCertificatesInfoFromPDF(buffer: Buffer): Promise<CertInfo[][]>;
}