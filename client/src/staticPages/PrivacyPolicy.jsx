import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from "lucide-react"
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
  const navigate = useNavigate();


  return (
    <div className="bg-white relative text-black py-10 px-5 lg:px-20">
      {/* Breadcrumb */}
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-5 left-20 z-40 hidden md:flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <div className="text-sm mt-10 text-gray-500 mb-6">
        <a href="/" className="text-gray-600 hover:text-[#E33831]">Home</a> /{' '}
        <span className="text-[#E33831]">Privacy Policy</span>
      </div>

      {/* Privacy Policy Heading */}
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-700 mb-8">
      Huntsworld B2B platform connecting manufacturers, suppliers, buyers, and students. We respect your privacy and are committed to protecting your personal information.
      </p>

      {/* Section 1: Information We Collect */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
        <p className="text-gray-700 mb-4">
          We collect Information to provide, enhance, and personalize our services, as well as to comply with legal and regulatory obligations.
        </p>
        <h3 className="text-xl font-medium mb-2">1.1 Information You Provide</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Registration:</strong> Name, company name, email address, phone number, postal and business address, statutory documents, and tax/GST registration numbers.</li>
          <li><strong>Service Use:</strong> Product/service details, business profile information, and content you choose to display on the Platform.</li>
          <li><strong>Payment Information:</strong> For paid services, bank account details, UPI information, or other payment-related data.</li>
          <li><strong>Communications:</strong> Call recordings, chat messages, support queries, and email correspondence for quality assurance and training purposes.</li>
        </ul>
        <h3 className="text-xl font-medium mb-2">1.2 Information Collected Automatically</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Usage Data:</strong> IP addresses, device information, geolocation, browser type, access times, log files, and user behavior analytics to optimize Platform performance.</li>
          <li><strong>Cookies and Tracking Technologies:</strong> Cookies, pixels, web beacons, and device IDs to support analytics, personalization, and security.</li>
        </ul>
        <h3 className="text-xl font-medium mb-2">1.3 Third-Party Data</h3>
        <p className="text-gray-700">
          Trusted third-party service providers (e.g., payment gateways, analytics providers, or verification agents) may collect additional Information to facilitate specific services, subject to their privacy policies.
        </p>
        <h3 className="text-xl font-medium mb-2 mt-4">1.4 Children’s Privacy</h3>
        <p className="text-gray-700">
          The Platform is not intended for individuals under 18 years of age. We do not knowingly collect Information from minors, and any such data discovered will be promptly deleted.
        </p>
      </div>

      {/* Section 2: Use of Information */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Use of Information</h2>
        <p className="text-gray-700 mb-4">
          We use your Information to deliver, improve, and personalize our services, including:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Verifying identity and eligibility for Platform registration.</li>
          <li>Providing and managing services such as listings, trend/view points, trust seals, and notifications.</li>
          <li>Facilitating communication, customer support, and sending newsletters, alerts, or promotional materials.</li>
          <li>Processing payments and responding to inquiries.</li>
          <li>Conducting analytics, advertising, and marketing to enhance user experience.</li>
          <li>Improving Platform security, auditing performance, and ensuring quality.</li>
          <li>Complying with legal, regulatory, and statutory obligations.</li>
        </ul>
        <p className="text-gray-700 mt-4">
          To object to any use of your Information or withdraw consent, contact us at <a href="mailto:support@huntsworld.com" className="text-[#E33831] hover:underline">support@huntsworld.com</a>. Note that this may impact your ability to access certain services.
        </p>
      </div>

      {/* Section 3: Disclosure of Information */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Disclosure of Information</h2>
        <p className="text-gray-700 mb-4">
          We may share your Information under the following circumstances:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Service Providers and Partners:</strong> With trusted third parties for Platform operations, payment processing, analytics, customer support, or verification, all bound by confidentiality obligations.</li>
          <li><strong>Affiliated Companies:</strong> To enhance service delivery, business matchmaking, and user experience.</li>
          <li><strong>Legal and Regulatory Authorities:</strong> As required by law, court orders, or to prevent, investigate, or prosecute criminal activities.</li>
          <li><strong>Business Partners:</strong> For offering relevant products or promotions (provided by third parties, not Huntsworld).</li>
          <li><strong>Public Information:</strong> Information you make public (e.g., profiles, listings, or messages) may be accessed by others. Exercise caution when sharing.</li>
        </ul>
        <p className="text-gray-700 mt-4">
          We are not responsible for the privacy practices of external websites linked from our Platform. Please review their respective privacy policies.
        </p>
      </div>

      {/* Section 4: Data Security */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
        <p className="text-gray-700">
          We implement industry-standard electronic and physical safeguards to protect your Information from unauthorized access, loss, or misuse. However, no online transmission or storage is entirely secure. We recommend using strong passwords, safeguarding credentials, and logging out after use, especially on shared devices. Huntsworld will never request your password or bank details via unsolicited communication.
        </p>
      </div>

      {/* Section 5: Data Retention */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
        <p className="text-gray-700">
          We retain your Information only as long as necessary to provide services, comply with legal obligations, or fulfill the purposes outlined in this policy. When no longer required, Information is securely deleted or anonymized, except where retention is mandated by law.
        </p>
      </div>

      {/* Section 6: Your Rights and Controls */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Controls</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Access and Correction:</strong> Update or verify your Information via your account or by contacting <a href="mailto:support@huntsworld.com" className="text-[#E33831] hover:underline">support@huntsworld.com</a>.</li>
          <li><strong>Data Portability:</strong> Request a copy of your Information for transfer to another service.</li>
          <li><strong>Account Deactivation/Deletion:</strong> Request deactivation or deletion of your account. Some Information may be retained for legal or archival purposes, subject to applicable laws.</li>
        </ul>
      </div>

      {/* Section 7: Cookies and Tracking Technologies */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking Technologies</h2>
        <p className="text-gray-700">
          We and our partners use cookies, web beacons, and similar technologies for session management, personalization, and analytics. You may disable cookies through your browser settings, though this may limit Platform functionality. Third-party advertisers and plugins may use their own cookies; refer to their privacy policies for details.
        </p>
      </div>

      {/* Section 8: Information About Minors */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Information About Minors</h2>
        <p className="text-gray-700">
          Huntsworld does not permit individuals under 18 to register or use our services. If we discover Information from minors, it will be promptly deleted. Contact us at <a href="mailto:support@huntsworld.com" className="text-[#E33831] hover:underline">support@huntsworld.com</a> if you believe such data has been collected.
        </p>
      </div>

      {/* Section 9: International Data Transfers */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
        <p className="text-gray-700">
          Your Information may be stored or processed in countries outside your jurisdiction. We ensure appropriate safeguards and compliance with this policy for all data handling, regardless of location.
        </p>
      </div>

      {/* Section 10: Changes to This Policy */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
        <p className="text-gray-700">
          We may update this Privacy Policy periodically. Changes will be posted on this page with an updated effective date. We encourage you to review this policy regularly to stay informed.
        </p>
      </div>

      {/* Section 11: Contact Us */}
 
      {/* Section 23: Contact Information */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
        <p className="text-gray-700">
          <strong>Huntsworld</strong><br />
          Registered Address: Address- 157,Thendral street, sudhana Nagar, Nainarmandabam, Puducherry,605004<br />
          Email: <a href="mailto:mahalakshmi@huntsworld.com" className="text-[#E33831] hover:underline">mahalakshmi@huntsworld.com</a><br />
          Support: <a href="mailto:contact@huntsworld.com" className="text-[#E33831] hover:underline">contact@huntsworld.com</a><br />
          Phone: +91 9944810225, +91 9944355114<br />
          Website: <a href="https://www.huntsworld.com" className="text-[#E33831] hover:underline">www.huntsworld.com</a><br />
 
        </p>
      </div>

      {/* Closing Statement */}
      <div className="shadow-lg rounded-lg p-10 max-w-8xl text-gray-700 italic text-lg text-center bg-gray-100">
        At Huntsworld, we are committed to transparency and trust in managing your Information. By using our Platform, you acknowledge and agree to the terms of this Privacy Policy.
      </div>
    </div>
  );
};

export default PrivacyPolicy;
