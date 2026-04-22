import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { OfferLetterData } from '../../pages/OfferLetterCreator';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface OfferLetterPreviewProps {
  offerData: OfferLetterData;
  showPreview: boolean;
  offerId?: string;
}

export interface OfferLetterPreviewRef {
  handleDownloadPDF: () => Promise<void>;
  isDownloading: boolean;
}

const OfferLetterPreview = forwardRef<OfferLetterPreviewRef, OfferLetterPreviewProps>(
  ({ offerData, showPreview, offerId }, ref) => {
    const offerRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      return dayjs(dateString).format('MMMM DD, YYYY');
    };

    const formatDateForFilename = (dateString: string) => {
      if (!dateString) return dayjs().format('YYYY-MM-DD');
      return dayjs(dateString).format('YYYY-MM-DD');
    };

    const loadImageAsBase64 = async (url: string): Promise<string> => {
      // 🔥 Skip if already base64
      if (url.startsWith('data:')) return url;

      return new Promise((resolve, reject) => {
        fetch(url)
          .then((response) => response.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
          .catch(reject);
      });
    };

    const handleDownloadPDF = async () => {
      if (!offerRef.current) return;
      setIsDownloading(true);

      try {
        toast.loading('Generating PDF...', { id: 'pdf-download' });

        // Convert all images to base64
        const images = offerRef.current.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map(async (img) => {
            if (img instanceof HTMLImageElement) {
              try {
                let imgUrl = img.src;
                if (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
                  imgUrl = `${window.location.origin}${imgUrl}`;
                }
                const base64 = await loadImageAsBase64(imgUrl);
                img.src = base64;
              } catch (error) {
                console.error('Failed to load image:', img.src, error);
              }
            }
          })
        );

        const canvas = await html2canvas(offerRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: offerRef.current.scrollWidth,
          windowHeight: offerRef.current.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png');

        const pdfWidth = 210;
        const pdfHeight = 297;

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;
        const x = (pdfWidth - scaledWidth) / 2;
        const y = 0;

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const candidateName = offerData.candidateName || 'Candidate';
        const issueDate = formatDateForFilename(offerData.issueDate);

        pdf.setProperties({
          title: `Offer Letter - ${candidateName}`,
          subject: `Offer Letter for ${candidateName}`,
          author: 'Shivohini TechAI',
          creator: 'Shivohini-Hub Offer Letter System',
        });

        pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

        const safeNameForFile = candidateName.replace(/[^a-z0-9]/gi, '_');
        const filename = `OfferLetter_${safeNameForFile}_${issueDate}.pdf`;

        pdf.save(filename);

        // 🔥 Upload to backend if offerId provided (no supabase)
        if (offerId) {
          try {
            const pdfBlob = pdf.output('blob');
            const formData = new FormData();
            formData.append('pdf', pdfBlob, filename);

            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/offer-letters/${offerId}/pdf`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            });
          } catch (uploadErr) {
            console.error('Error uploading PDF:', uploadErr);
            // Don't fail the download if upload fails
          }
        }

        toast.success('PDF downloaded successfully.', { id: 'pdf-download' });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF. Please try again.', { id: 'pdf-download' });
      } finally {
        setIsDownloading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      handleDownloadPDF,
      isDownloading,
    }));

    if (!showPreview) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <p className="text-lg">Click "Preview" to see the offer letter</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto bg-gray-100">
        <div className="p-8">
          <div
            ref={offerRef}
            className="mx-auto bg-white shadow-2xl relative"
            style={{
              width: '210mm',
              height: '297mm',
              fontFamily: 'Times New Roman, serif',
              color: 'black',
              position: 'relative',
              overflow: 'hidden',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          >
            {/* Header Section */}
            <div className="px-16 pt-6 pb-2">
              <div className="flex justify-between items-center mb-3">
                {/* Logo on the left */}
                <div className="flex-shrink-0">
                  <img
                    src={`${window.location.origin}/Logo_withoutBG.png`}
                    alt="Shivohini TechAI"
                    style={{ width: '120px', height: 'auto' }}
                    crossOrigin="anonymous"
                  />
                </div>

                {/* Company info on the right */}
                <div className="text-right leading-tight" style={{ lineHeight: '1.2' }}>
                  <h1 style={{ fontFamily: 'Times New Roman, serif', fontSize: '20px', fontWeight: 700, marginBottom: '3px' }}>
                    Shivohini TechAI LLP.
                  </h1>
                  <p style={{ fontFamily: 'Times New Roman, serif', fontSize: '13px', marginBottom: '3px' }}>
                    LLPIN: ACN-4613
                  </p>
                  <p style={{ fontFamily: 'Times New Roman, serif', fontStyle: 'italic', fontSize: '15px', marginTop: '2px' }}>
                    offer letter
                  </p>
                </div>
              </div>

              {/* Gradient line */}
              <div style={{
                height: '3px',
                background: 'linear-gradient(to right, #0099A8 0%, #F5B041 100%)',
                marginTop: '8px',
                marginBottom: '12px'
              }}></div>
            </div>

            {/* Body Section */}
            <div className="px-16 pb-4" style={{ fontSize: '13px', lineHeight: '1.5' }}>

              {/* Recipient */}
              <div className="mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold" style={{ marginBottom: '2px' }}>To,</p>
                    <p style={{ marginBottom: '1px' }}>{offerData.candidateName || '[Candidate Name]'}</p>
                    <p>{offerData.candidateEmail || '[Email ID]'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ marginBottom: '2px' }}>Date:</p>
                    <p className="italic">{formatDate(offerData.issueDate) || 'September 17, 2025'}</p>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="mb-3">
                <p><span className="font-bold">Subject:</span> Offer of Internship</p>
              </div>

              {/* Opening */}
              <div className="mb-2">
                <p>Dear {offerData.candidateName || '[Candidate Name]'},</p>
              </div>

              <div className="mb-3">
                <p>
                  We are pleased to offer you an <span className="font-bold">Internship</span> with{' '}
                  <span className="font-bold">Shivohini TechAI LLP</span> as{' '}
                  <span className="font-bold">{offerData.positionTitle || '[Position Title]'}</span> in the{' '}
                  <span className="font-bold">{offerData.department || '[Department/Practice]'}</span>.
                  Your skills and motivation align with our mission to build practical, industry-grade AI and software solutions.
                  We look forward to your contributions.
                </p>
              </div>

              {/* Terms & Conditions */}
              <div className="mb-3">
                <h2 className="text-base font-bold mb-2">Terms & Conditions</h2>
                <ul className="space-y-2 ml-6">
                  <li>
                    <span className="font-bold">Internship Nature:</span> This is a temporary role offered for a fixed duration and does not guarantee full-time employment. However, based on performance, full-time opportunities may be considered.
                  </li>
                  <li>
                    <span className="font-bold">Confidentiality & Intellectual Property:</span> You must maintain strict confidentiality regarding company data, projects, and intellectual property. Any work produced during the internship will remain the sole property of <span className="font-bold">Shivohini TechAI LLP</span>.
                  </li>
                  <li>
                    <span className="font-bold">Performance Evaluation:</span> Your performance will be assessed based on your technical skills, problem-solving abilities, and contributions to projects.
                  </li>
                  <li>
                    <span className="font-bold">Company Policies:</span> You are required to comply with all company policies, including ethical standards, security protocols, and professional conduct.
                  </li>
                  <li>
                    <span className="font-bold">Termination Clause:</span> <span className="font-bold">Shivohini TechAI LLP</span> reserves the right to terminate the internship at any time based on performance issues, misconduct, or breach of confidentiality.
                  </li>
                </ul>
              </div>

              {/* Offer Acceptance */}
              <div className="mb-2">
                <h2 className="text-base font-bold mb-1">Offer Acceptance</h2>
                <p style={{ marginBottom: '4px' }}>
                  Please sign and return a scanned copy of this letter by{' '}
                  <span className="font-bold">
                    {offerData.acceptanceDeadline ? formatDate(offerData.acceptanceDeadline) : '[Acceptance Deadline]'}
                  </span>.
                  We're excited to welcome you to <span className="font-bold">Shivohini TechAI LLP</span>.
                </p>
              </div>

              {/* Closing */}
              <div className="mb-1">
                <p style={{ marginBottom: '20px' }}>Warm regards,</p>
                <div>
                  <p className="font-bold" style={{ marginBottom: '1px' }}>Dr. Gunjan Bhatia</p>
                  <p style={{ marginBottom: '1px' }}>CEO & Founder</p>
                  <p className="font-bold">Shivohini TechAI LLP</p>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t-2 border-gray-800 mb-4"></div>

              {/* Acknowledgment */}
              <div className="mb-2">
                <h2 className="text-base font-bold mb-2">Acknowledgment & Acceptance</h2>
                <p className="mb-4">
                  I, {offerData.candidateName || '[Candidate Name]'}, accept the{' '}
                  {offerData.positionTitle || '[Position Title]'} internship at{' '}
                  <span className="font-bold">Shivohini TechAI LLP</span> under the terms above.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p>Signature: _______________________</p>
                  </div>
                  <div>
                    <p>Date: _______________________</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', marginTop: '-40px' }}>
              <img
                src={`${window.location.origin}/OfferLetter_bottomDesign.png`}
                alt="Bottom Design"
                className="w-full h-auto"
                style={{ display: 'block' }}
                crossOrigin="anonymous"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

OfferLetterPreview.displayName = 'OfferLetterPreview';

export default OfferLetterPreview;