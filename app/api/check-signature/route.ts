import { NextRequest, NextResponse } from 'next/server';
import { getCertificatesInfoFromPDF, type CertInfo } from 'pdf-signature-reader';

async function extractCertificatesInfo(pdfBuffer: Buffer): Promise<CertInfo[][]> {
    try {
        const certsInfo = await getCertificatesInfoFromPDF(pdfBuffer);
        return certsInfo;
    } catch (error) {
        console.error('Error extracting certificates info:', error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
  try {
    const buffer = await request.arrayBuffer();
    const pdfBuffer = Buffer.from(buffer);

    const certsInfo = await extractCertificatesInfo(pdfBuffer);
    
    if (!certsInfo || certsInfo.length === 0) {
      return NextResponse.json(
        { error: 'File PDF này không có chữ ký số. Vui lòng kiểm tra lại file PDF có chữ ký.' },
        { status: 400 }
      );
    }

    // Return in nested array format: [[cert1, cert2, cert3]]
    return NextResponse.json(certsInfo);
  } catch (error) {
    console.error('Error checking PDF signature:', error);
    const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi kiểm tra chữ ký';
    console.log(errorMessage, "Error message");
    if (errorMessage === "Failed to locate ByteRange.") {
      return NextResponse.json(
        { error: 'PDF không chứa chữ ký số hợp lệ (không tìm thấy ByteRange). Vui lòng kiểm tra lại file PDF bằng phần mềm Foxit Reader hoặc Adobe Acrobat Reader.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}