import React from 'react';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { AppreciationCertificateData } from '../../services/appreciationCertificate';

dayjs.extend(advancedFormat);

// 🔥 Load fonts from Google Fonts (avoids corrupt local font errors)
const fontLink = document.getElementById('google-fonts-appreciation');
if (!fontLink) {
  const link = document.createElement('link');
  link.id = 'google-fonts-appreciation';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Great+Vibes&family=Playfair+Display:wght@400;600;700&display=swap';
  document.head.appendChild(link);
}

interface AppreciationCertificatePreviewProps {
  certificateData: AppreciationCertificateData;
  showPreview: boolean;
}

const AppreciationCertificatePreview: React.FC<AppreciationCertificatePreviewProps> = ({
  certificateData,
  showPreview
}) => {

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return dayjs(dateString).format('Do MMMM, YYYY');
  };

  const formatJoiningDate = (dateString: string) => {
    const day = dayjs(dateString).format('D');
    const suffix = dayjs(dateString).format('Do').replace(/\d+/g, '');
    const rest = dayjs(dateString).format('MMMM, YYYY').toUpperCase();
    return { day, suffix, rest };
  };

  if (!showPreview) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Click "Preview" to see the appreciation certificate
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-900">
      <div className="p-8">
        <div
          id="certificate-preview"
          className="mx-auto bg-white shadow-2xl relative"
          style={{ width: '210mm', minHeight: '297mm' }}
        >

          {/* TOP DESIGN */}
          <img
            src="/appreciationletter_topdesign.png"
            alt="Top Design"
            className="w-full h-auto object-cover"
          />

          {/* HEADER LOGOS */}
          <div className="flex justify-between items-center px-16 pt-4">
            <img
              src="/Logo_withoutBG.png"
              alt="Shivohini TechAI"
              className="h-28 w-auto"
            />
            <img
              src="/badge_shivohinitechai.png"
              alt="Shivohini TechAI Badge"
              className="h-28 w-auto"
            />
          </div>

          {/* BODY */}
          <div className="text-center px-16 mt-4">

            {/* TITLE */}
            <h1
              className="font-bold tracking-widest text-gray-900"
              style={{ fontFamily: "'Cinzel', serif", fontSize: '48px', letterSpacing: '10px' }}
            >
              CERTIFICATE
            </h1>

            <h2
              className="font-semibold tracking-wider text-gray-700"
              style={{ fontFamily: "'Cinzel', serif", fontSize: '24px', letterSpacing: '6px', marginTop: '4px' }}
            >
              OF APPRECIATION
            </h2>

            {/* DIVIDER */}
            <div style={{
              width: '80px',
              height: '2px',
              background: 'linear-gradient(to right, #a855f7, #3b82f6)',
              margin: '16px auto'
            }} />

            <p
              className="font-bold tracking-widest text-gray-500 uppercase"
              style={{ fontSize: '11px', letterSpacing: '4px', marginTop: '16px' }}
            >
              THIS CERTIFICATE IS AWARDED TO
            </p>

            {/* RECIPIENT NAME — Great Vibes replaces Stars & Love */}
            <h1
              className="text-gray-900"
              style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: '52px',
                fontWeight: 'bold',
                marginTop: '8px',
                marginBottom: '4px'
              }}
            >
              {certificateData.recipientName || '[Recipient Name]'}
            </h1>

            {/* JOINING DATE — Playfair Display replaces Gagalin */}
            {certificateData.joiningDate && (() => {
              const { day, suffix, rest } = formatJoiningDate(certificateData.joiningDate);
              return (
                <p
                  className="text-gray-800 uppercase mb-6"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 'bold',
                    fontSize: '18px',
                    letterSpacing: '2px',
                    marginTop: '6px'
                  }}
                >
                  JOINED ON {day}
                  <sup style={{ fontSize: '60%', verticalAlign: 'super' }}>
                    {suffix}
                  </sup>{' '}
                  {rest}
                </p>
              );
            })()}

            {/* APPRECIATION TEXT */}
            <p
              className="text-gray-800 leading-relaxed max-w-2xl mx-auto"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px' }}
            >
              is hereby awarded this certificate as a token of appreciation for{' '}
              <span className="font-semibold">
                {certificateData.appreciationFor || '[Reason for Appreciation]'}
              </span>.
              We sincerely acknowledge and appreciate the dedication, effort, and contribution made.
            </p>

            <p
              className="text-gray-700 mt-6"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px' }}
            >
              Your commitment and excellence have been truly commendable.
            </p>

            {/* FOOTER */}
            <div className="mt-12 flex justify-between items-end px-4">

              {/* DATE */}
              <div className="text-left">
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {formatDate(certificateData.issueDate)}
                </p>
              </div>

              {/* SIGNATURE */}
              <div className="text-right">
                <p
                  className="font-bold"
                  style={{ fontFamily: "'Cinzel', serif", fontSize: '15px' }}
                >
                  Dr. GUNJAN BHATIA
                </p>
                <p className="text-sm text-gray-600">CEO & FOUNDER</p>
                <p className="text-sm text-gray-600 font-medium">SHIVOHINI TECHAI LLP</p>
                <div className="border-t-2 border-gray-600 w-48 mt-2 ml-auto" />
              </div>

            </div>
          </div>

          {/* BOTTOM DESIGN */}
          <div className="mt-16">
            <img
              src="/appreciationletter_bottomdesign.png"
              alt="Bottom Design"
              className="w-full h-auto"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default AppreciationCertificatePreview;