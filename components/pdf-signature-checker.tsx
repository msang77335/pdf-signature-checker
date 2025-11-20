'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Building, Calendar, CheckCircle, FileText, Upload, User, XCircle } from 'lucide-react';
import { type CertInfo } from 'pdf-signature-reader';
import { useState } from 'react';
import * as iconv from 'iconv-lite';

export default function PDFSignatureChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [openItems, setOpenItems] = useState<number[]>([]);

  const validateAndSetFile = (selectedFile: File | null) => {
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    } else {
      setError('Vui lòng chọn file PDF hợp lệ');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile || null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi kiểm tra chữ ký');
      }

      const data = await response.json();
      console.log(data, 'data received from API');
      // Handle nested array format from API: [[cert1, cert2, cert3]]
      const certificates = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;
      setResult(certificates);
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

  const isExpired = (notAfter: string) => {
    return new Date() > new Date(notAfter);
  };

  const cleanVietnameseText = (text: string): string => {
    if (!text) return text;
    
    try {
      // Try to detect if this is a double-encoded text by checking for common patterns
      if (text.includes('Ã') || text.includes('Æ') || text.includes('áº')) {
        // This looks like UTF-8 bytes being interpreted as ISO-8859-1
        // First encode as iso-8859-1, then decode as utf-8
        const buffer = Buffer.from(text, 'binary');
        const decoded = iconv.decode(buffer, 'utf8');
        
        return decoded;
      }
      
      // If no encoding issues detected, return as-is
      return text.trim();
    } catch (error) {
      console.warn('Failed to decode text:', error);
      return text;
    }
  };

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
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
              <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">File PDF</span>
              <div className="relative">
                <input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                />
                <label
                  htmlFor="pdf-file"
                  className={`block w-full border-2 border-dashed rounded-lg p-6 transition-colors ${
                    dragActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="text-center pointer-events-none">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-900">
                        {dragActive ? 'Thả file PDF vào đây' : 'Kéo thả file PDF vào đây'}
                      </p>
                      <p className="text-sm text-gray-500">
                        hoặc <span className="text-blue-600 font-medium">chọn file</span> từ máy tính
                      </p>
                    </div>
                  </div>
                </label>
              </div>
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

        {result && result.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Thông tin Certificate ({result.flat().length} certificate{result.flat().length > 1 ? 's' : ''})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.flat().map((cert, index) => {
                console.log(cert);
                const isOpen = openItems.includes(index);
                const certKey = `${cert.issuedBy?.commonName || 'unknown'}-${cert.validityPeriod?.notBefore || Date.now()}-${index}`;
                
                return (
                  <Collapsible key={certKey} className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-sm">
                    <CollapsibleTrigger 
                      isOpen={isOpen}
                      onClick={() => toggleItem(index)}
                      className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors duration-200 text-left focus:outline-none focus:bg-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">Certificate {index + 1}</span>
                        <Badge variant={cert.validityPeriod?.notAfter && isExpired(cert.validityPeriod.notAfter) ? "destructive" : "secondary"} 
                               className={cert.validityPeriod?.notAfter && isExpired(cert.validityPeriod.notAfter) ? "" : "bg-green-100 text-green-800"}>
                          {cert.validityPeriod?.notAfter && isExpired(cert.validityPeriod.notAfter) ? 'Hết hạn' : 'Còn hiệu lực'}
                        </Badge>
                        <Badge variant="outline">
                          {cert.clientCertificate ? 'Client' : 'Server'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-3">
                        {cleanVietnameseText(cert.issuedTo?.commonName || cert.issuedTo?.organizationName || 'Certificate')}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent isOpen={isOpen} className="border-t bg-gray-50">
                      <div 
                        id={`certificate-${index}`} 
                        className="p-4 space-y-4"
                      >
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Thông tin người được cấp
                            </h4>
                            <div className="bg-white p-3 rounded-lg space-y-2">
                              <div className="flex gap-2 text-sm">
                                <span className="font-medium min-w-32">Quốc gia:</span>
                                <span className="text-gray-700">{cert.issuedTo?.countryName || 'N/A'}</span>
                              </div>
                              {cert.issuedTo?.stateOrProvinceName && (
                                <div className="flex gap-2 text-sm">
                                  <span className="font-medium min-w-32">Tỉnh/Thành phố:</span>
                                  <span className="text-gray-700">{cleanVietnameseText(cert.issuedTo.stateOrProvinceName)}</span>
                                </div>
                              )}
                              {cert.issuedTo?.organizationName && (
                                <div className="flex gap-2 text-sm">
                                  <span className="font-medium min-w-32">Tổ chức:</span>
                                  <span className="text-gray-700">{cleanVietnameseText(cert.issuedTo.organizationName)}</span>
                                </div>
                              )}
                              {cert.issuedTo?.commonName && (
                                <div className="flex gap-2 text-sm">
                                  <span className="font-medium min-w-32">Tên đầy đủ:</span>
                                  <span className="text-gray-700">{cleanVietnameseText(cert.issuedTo.commonName)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Nhà phát hành (CA)
                            </h4>
                            <div className="bg-white p-3 rounded-lg space-y-2">
                              <div className="flex gap-2 text-sm">
                                <span className="font-medium min-w-32">Tên CA:</span>
                                <span className="text-gray-700">{cleanVietnameseText(cert.issuedBy?.commonName || 'N/A')}</span>
                              </div>
                              <div className="flex gap-2 text-sm">
                                <span className="font-medium min-w-32">Tổ chức:</span>
                                <span className="text-gray-700">{cleanVietnameseText(cert.issuedBy?.organizationName || 'N/A')}</span>
                              </div>
                              <div className="flex gap-2 text-sm">
                                <span className="font-medium min-w-32">Quốc gia:</span>
                                <span className="text-gray-700">{cert.issuedBy?.countryName || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Thời hạn hiệu lực
                            </h4>
                            <div className="bg-white p-3 rounded-lg space-y-2">
                              <div className="flex gap-2 text-sm">
                                <span className="font-medium min-w-20">Từ:</span>
                                <span className="text-gray-700">
                                  {cert.validityPeriod?.notBefore ? formatDate(cert.validityPeriod.notBefore) : 'N/A'}
                                </span>
                              </div>
                              <div className="flex gap-2 text-sm">
                                <span className="font-medium min-w-20">Đến:</span>
                                <span className="text-gray-700">
                                  {cert.validityPeriod?.notAfter ? formatDate(cert.validityPeriod.notAfter) : 'N/A'}
                                </span>
                              </div>
                              <div className="flex gap-2 text-sm">
                                <span className="font-medium min-w-20">Trạng thái:</span>
                                <Badge variant={cert.validityPeriod?.notAfter && isExpired(cert.validityPeriod.notAfter) ? "destructive" : "secondary"} 
                                       className={cert.validityPeriod?.notAfter && isExpired(cert.validityPeriod.notAfter) ? "" : "bg-green-100 text-green-800"}>
                                  {cert.validityPeriod?.notAfter && isExpired(cert.validityPeriod.notAfter) ? 'Hết hạn' : 'Còn hiệu lực'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}