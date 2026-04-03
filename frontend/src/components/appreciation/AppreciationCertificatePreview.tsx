import React from 'react';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { AppreciationCertificateData } from '../../services/appreciationCertificate';
dayjs.extend(advancedFormat);
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
          className="max-w-4xl mx-auto bg-white shadow-2xl"
          style={{ width: '210mm', minHeight: '297mm' }}
        >
          <div className="relative">
            {/* upper Design */}
            <div className="w-full">
              <img
                src="/public/appreciationletter_topdesign.png"
                alt="Top Design"
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Header Logo */}
            <div className="px-12 pt-6 flex justify-center items-center gap-6">
              <img src="/public/badge_shivohinitechai.png" 
              alt="Shivohini TechAI Badge"
              className='h-40 w-auto' 
              />
              <img
                src="/Logo_withoutBG.png"
                alt="Shivohini TechAI"
                className="h-40 w-auto"
              /> 
            </div>

            {/* Body */}
            <div className="text-center mb-8">
              <h1 className="text-6xl font-roboto font-bold tracking-widest text-gray-900 leading-tight">CERTIFICATE</h1>
              <h2 className="text-3xl font-roboto font-semibold tracking-wider text-gray-700 ">OF APPRECIATION</h2>

              <p className="text-sm mt-10 font-bold tracking-widest text-gray-600">THIS CERTIFICATE IS AWARDED TO</p>

              <h1 className="mb-2 text-gray-900" style={{ fontFamily: "'Stars & Love', cursive", fontSize: '48px', fontWeight: 'bold' }}>
                {certificateData.recipientName || '[Recipient Name]'}
              </h1>

              {certificateData.joiningDate && (() => {
  const { day, suffix, rest } = formatJoiningDate(certificateData.joiningDate);

  return (
    <p
      className="mb-6 text-gray-800 uppercase"
      style={{
        fontFamily: "'Gagalin', cursive",
        fontWeight: 'bold',
        fontSize: '20px',
        
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


              <p className="text-lg leading-relaxed text-gray-800 max-w-2xl mx-auto">
                is hereby awarded this certificate as a token of appreciation for
                <span className="font-semibold"> {certificateData.appreciationFor || '[Reason for Appreciation]'}</span>.
                We sincerely acknowledge and appreciate the dedication, effort, and contribution made.
              </p>

              <p className="mt-8 text-gray-700">
                Your commitment and excellence have been truly commendable.
              </p>

              {/* Footer */}
              <div className="mt-16 flex justify-between items-center">
                <div className="text-left">
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{formatDate(certificateData.issueDate)}</p>
                </div>

                <div className="text-right">
                  <div className="border-t-2 border-gray-600 w-48 mb-1 ml-auto"></div>
                  <p className="font-bold">Dr. GUNJAN BHATIA</p>
                  <p className="text-sm text-gray-600">CEO & FOUNDER</p>
                  <p className="text-sm text-gray-600 font-medium">SHIVOHINI TECHAI LLP </p>
                </div>
              </div>
            </div>

            {/* Bottom Design */}
            <div className="mt-20">
              <img
                src="/public/appreciationletter_bottomdesign.png"
                alt="Bottom Design"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppreciationCertificatePreview;
