import React from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { FileText, MessageSquare } from 'lucide-react';

const SellerDetails = ({ seller, onClose }) => {
  return (
    <div className="mt-6 p-6 bg-white rounded-xl shadow-md max-w-full relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Close"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Seller Details</h3>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Small Card */}
        <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-lg shadow-sm">
          {seller.company_logo && (
            <Zoom>
              <img
                src={seller.company_logo}
                alt="Company Logo"
                className="w-24 h-24 object-cover rounded-md mb-2 mx-auto cursor-pointer"
              />
            </Zoom>
          )}
          <h4 className="text-lg font-medium text-gray-800 text-center">
            {seller.shop_name || 'N/A'}
          </h4>
          <p className="text-gray-600 text-center text-sm">
            {seller.shop_email || 'N/A'}
          </p>
          <div className="mt-4 space-y-2 text-gray-600 text-sm">
            <p><strong>Phone:</strong> {seller.shop_phone_number || 'N/A'}</p>
            <p>
              <strong>{seller.pan ? 'PAN' : seller.msme_certificate_number ? 'MSME' : 'GST'}:</strong>{' '}
              {seller.pan || seller.msme_certificate_number || seller.gst_number || 'N/A'}
            </p>
            <p><strong>Aadhar:</strong> {seller.aadhar || 'N/A'}</p>
          </div>
          {seller.company_images?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">Images:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {seller.company_images.map((image, index) => (
                  <Zoom key={index}>
                    <img
                      src={image}
                      alt={`Company Image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-md cursor-pointer"
                    />
                  </Zoom>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-row gap-2">
            <button
              className="flex items-center bg-[#1c1b20] hover:bg-[#c0302c] text-white py-2 px-4 rounded-md"
              onClick={() => console.log('View Requirement clicked')}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Requirement
            </button>
            <button
              className="flex items-center bg-[#1c1b20] hover:bg-[#c0302c] text-white py-2 px-4 rounded-md"
              onClick={() => console.log('Contact Seller clicked')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Seller
            </button>
          </div>
        </div>
        {/* Large Card */}
        <div className="w-full md:w-2/3 bg-gray-50 p-4 rounded-lg shadow-sm">
          <div className="space-y-2 text-gray-600">
            <p><strong>Verified:</strong> {seller.verified_status ? 'Yes' : 'No'}</p>
            {seller.user_id && (
              <p><strong>User ID:</strong> {seller.user_id._id || 'N/A'}</p>
            )}
            {seller.address_id && (
              <p><strong>Address ID:</strong> {seller.address_id._id || 'N/A'}</p>
            )}
            {!seller.pan && (
              <p><strong>PAN:</strong> {seller.pan || 'N/A'}</p>
            )}
            {!seller.msme_certificate_number && (
              <p><strong>MSME Certificate:</strong> {seller.msme_certificate_number || 'N/A'}</p>
            )}
            {!seller.gst_number && (
              <p><strong>GST Number:</strong> {seller.gst_number || 'N/A'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDetails;
