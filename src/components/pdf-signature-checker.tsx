'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, XCircle, Calendar, Building, User } from 'lucide-react';
import { CertificateInfo } from '@/lib/pdf-signature';

export default function PDFSignatureChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    } else {
      setError('Vui lòng chọn file PDF hợp lệ');
    }
  };

  const handleCheck = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const response = await fetch('/api/check-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: buffer,
      });

      if (!response.ok) {
        throw new Error('Lỗi kiểm tra chữ ký');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseSubject = (subject: string) => {
    const parts = subject.split(', ');
    const parsed: Record<string, string> = {};
    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        parsed[key] = value;
      }
    });
    return parsed;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">PDF Signature Checker</h1>
          <p className="text-lg text-gray-600">Kiểm tra chữ ký số trong file PDF</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload PDF File
            </CardTitle>
            <CardDescription>
              Chọn file PDF có chữ ký số để kiểm tra thông tin certificate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-file">File PDF</Label>
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleCheck} 
              disabled={!file || loading}
              className="w-full"
            >
              {loading ? 'Đang kiểm tra...' : 'Kiểm tra chữ ký'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Thông tin Certificate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="font-medium">Trạng thái:</span>
                <Badge variant={result.expired ? "destructive" : "default"}>
                  {result.expired ? 'Đã hết hạn' : 'Còn hiệu lực'}
                </Badge>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Thông tin người ký
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                    {Object.entries(parseSubject(result.subject)).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-sm">
                        <span className="font-medium min-w-8">{key}:</span>
                        <span className="text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Nhà phát hành (CA)
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                    {Object.entries(parseSubject(result.issuer)).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-sm">
                        <span className="font-medium min-w-8">{key}:</span>
                        <span className="text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Thời hạn hiệu lực
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                    <div className="flex gap-2 text-sm">
                      <span className="font-medium">Từ:</span>
                      <span className="text-gray-700">{formatDate(result.validFrom.toString())}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="font-medium">Đến:</span>
                      <span className="text-gray-700">{formatDate(result.validTo.toString())}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}