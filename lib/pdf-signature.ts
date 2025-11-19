import * as forge from "node-forge";

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  expired: boolean;
}

function extractSignature(pdfBuffer: Buffer) {
  const pdfText = pdfBuffer.toString("latin1");

  const byteRangeMatch = pdfText.match(/ByteRange\s*\[\s*(\d+) (\d+) (\d+) (\d+)\s*\]/);
  if (!byteRangeMatch) {
    throw new Error("File PDF này không có chữ ký số. Vui lòng kiểm tra lại file PDF có chữ ký.");
  }

  const byteRange = byteRangeMatch.slice(1).map(Number);

  const signed1 = pdfBuffer.slice(byteRange[0], byteRange[0] + byteRange[1]);
  const signed2 = pdfBuffer.slice(byteRange[2], byteRange[2] + byteRange[3]);
  const signedData = Buffer.concat([signed1, signed2]);

  const contentsMatch = pdfText.match(/Contents\s*<([0-9A-Fa-f]+)>/);
  if (!contentsMatch) throw new Error("File PDF có chữ ký nhưng không thể đọc được nội dung chữ ký. File có thể bị hỏng.");

  const signatureHex = contentsMatch[1];
  const signature = Buffer.from(signatureHex, "hex");

  return { signedData, signature };
}

function decodeText(text: string): string {
  try {
    // If text is already properly encoded, return as is
    if (!/[\x80-\xFF]/.test(text)) return text;
    
    // Try to decode as UTF-8
    return Buffer.from(text, 'latin1').toString('utf8');
  } catch (e) {
    return text; // Fallback to original if decoding fails
  }
}

function parseCertInfo(cert: forge.pki.Certificate): CertificateInfo {
  // Only include attributes with a valid shortName
  const subject = cert.subject.attributes
    .filter(a => a.shortName)
    .map(a => `${a.shortName}=${decodeText(a.value as string)}`)
    .join(", ");
  const issuer = cert.issuer.attributes
    .filter(a => a.shortName)
    .map(a => `${a.shortName}=${decodeText(a.value as string)}`)
    .join(", ");

  return {
    subject,          // người ký
    issuer,           // nhà phát hành CA
    validFrom: cert.validity.notBefore,
    validTo: cert.validity.notAfter,
    expired: new Date() > cert.validity.notAfter
  };
}

export function checkPdfSignature(pdfBuffer: Buffer): CertificateInfo {
  try {
    const { signature } = extractSignature(pdfBuffer);

    // Remove trailing zeros (padding) from signature
    let trimmedSignature = signature;
    for (let i = signature.length - 1; i >= 0; i--) {
      if (signature[i] !== 0) {
        trimmedSignature = signature.slice(0, i + 1);
        break;
      }
    }

    const p7 = forge.pkcs7.messageFromAsn1(
      forge.asn1.fromDer(trimmedSignature.toString("binary"))
    );

    const cert = (p7 as any).certificates?.[0];
    if (!cert) {
      throw new Error("File PDF có chữ ký nhưng không thể đọc thông tin certificate. Chữ ký có thể không hợp lệ hoặc bị hỏng.");
    }

    return parseCertInfo(cert);
  } catch (error) {
    // If it's already our custom error message, re-throw it
    if (error instanceof Error && error.message.includes('File PDF')) {
      throw error;
    }
    // For other parsing errors, provide a generic message
    throw new Error('Không thể phân tích chữ ký PDF. File có thể bị hỏng hoặc định dạng chữ ký không được hỗ trợ.');
  }
}