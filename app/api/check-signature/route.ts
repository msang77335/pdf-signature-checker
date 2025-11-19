import { NextRequest, NextResponse } from 'next/server';
import { checkPdfSignature } from '@/lib/pdf-signature';

export async function POST(request: NextRequest) {
  try {
    const buffer = await request.arrayBuffer();
    const pdfBuffer = Buffer.from(buffer);

    const result = checkPdfSignature(pdfBuffer);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking PDF signature:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi kiểm tra chữ ký' },
      { status: 500 }
    );
  }
}