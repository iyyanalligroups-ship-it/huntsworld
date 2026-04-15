import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from "lucide-react"
import { useNavigate } from 'react-router-dom';

const TermsConditions = () => {
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
        <span className="text-[#E33831]">Terms and Conditions</span>
      </div>

      {/* Terms and Conditions Heading */}
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      <p className="text-gray-700 mb-8">
    These terms and conditions constitute a legally binding agreement between you and huntsworld governing your access to and use of huntsworld platform, including our website and mobile application. By accessing or using the platform, you acknowledge that you have read, understood and agreed to be bound by these terms. If you do not agree you must not use the platform.
      </p>

      {/* Section 1: Introduction */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <h3 className="text-xl font-medium mb-2">1.1 Platform Overview</h3>
        <p className="text-gray-700 mb-4">
          Huntsworld operates as a Business-to-Business (B2B) marketplace facilitating connections between buyers and sellers. We provide a platform for business transactions but are not a party to any sales agreements between Users.
        </p>
        <h3 className="text-xl font-medium mb-2">1.2 User Eligibility</h3>
        <p className="text-gray-700">
          The Platform is available only to individuals or entities who:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Can form legally binding contracts under Indian law.</li>
          <li>Are business entities (e.g., sole proprietorships, partnerships, companies).</li>
          <li>Are at least 18 years of age.</li>
          <li>Are authorized to conduct business in India or their respective jurisdictions.</li>
        </ul>
        <p className="text-gray-700">
          Minors under 18, undischarged insolvents, or entities incompetent to contract under the Indian Contract Act, 1872, are not eligible to use the Platform.
        </p>
      </div>

      {/* Section 2: Definitions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>B2B:</strong> Business-to-Business transactions.</li>
          <li><strong>Buyer:</strong> A User purchasing goods or services via the Platform.</li>
          <li><strong>Data Principal:</strong> An individual to whom personal data relates, as per the Digital Personal Data Protection Act, 2023.</li>
          <li><strong>Data Fiduciary:</strong> An entity determining the purpose and means of processing personal data.</li>
          <li><strong>Marketplace:</strong> The Huntsworld B2B platform.</li>
          <li><strong>Personal Data:</strong> Data about an identifiable natural person.</li>
          <li><strong>Seller:</strong> A User offering goods or services for sale on the Platform.</li>
          <li><strong>Services:</strong> All services provided by Huntsworld via the Platform.</li>
          <li><strong>Sensitive Personal Data:</strong> Financial, biometric, or other sensitive data as defined by Indian law.</li>
          <li><strong>Trend Points:</strong> Huntsworld’s proprietary ranking system based on user engagement and product relevance.</li>
          <li><strong>User:</strong> Any person or entity accessing or using the Platform.</li>
        </ul>
      </div>

      {/* Section 3: Platform Services */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Platform Services</h2>
        <h3 className="text-xl font-medium mb-2">3.1 Core Services</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Marketplace platform for connecting Buyers and Sellers.</li>
          <li>Product listing and showcasing services for Sellers.</li>
          <li>Advanced search and discovery with Trend Points ranking.</li>
          <li>Communication tools for messaging and contact facilitation.</li>
          <li>Premium subscription plans with enhanced features.</li>
          <li>Referral programs and viewpoint earnings for user engagement.</li>
          <li>Additional services, including social media marketing and website development.</li>
        </ul>
        <h3 className="text-xl font-medium mb-2">3.2 Limitations</h3>
        <p className="text-gray-700">
          Huntsworld is a platform provider only and does not:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Manufacture, store, or sell listed products.</li>
          <li>Guarantee product quality, safety, legality, or availability.</li>
          <li>Verify the accuracy of product descriptions or Seller information.</li>
          <li>Assume liability for transaction outcomes between Users.</li>
        </ul>
      </div>

      {/* Section 4: User Accounts */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. User Accounts</h2>
        <h3 className="text-xl font-medium mb-2">4.1 Account Creation</h3>
        <p className="text-gray-700 mb-4">
          To access certain features, Users must create an account by providing accurate:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Business information and registration documents.</li>
          <li>Contact details (email and phone number).</li>
          <li>Tax identification numbers (e.g., GST).</li>
          <li>Banking details for payment processing.</li>
        </ul>
        <h3 className="text-xl font-medium mb-2">4.2 Account Security</h3>
        <p className="text-gray-700">
          Users are responsible for maintaining account confidentiality, using strong passwords, and notifying us immediately of unauthorized use.
        </p>
        <h3 className="text-xl font-medium mb-2 mt-4">4.3 Verification</h3>
        <p className="text-gray-700">
          Huntsworld may verify User information, request additional documentation, and suspend accounts pending verification or for periodic re-verification.
        </p>
      </div>

      {/* Section 5: User Conduct */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. User Conduct</h2>
        <h3 className="text-xl font-medium mb-2">5.1 Acceptable Use</h3>
        <p className="text-gray-700 mb-4">
          Users must provide accurate information, comply with laws, respect intellectual property, and conduct transactions professionally.
        </p>
        <h3 className="text-xl font-medium mb-2">5.2 Prohibited Activities</h3>
        <ul className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Fraudulent practices or fake accounts.</li>
          <li>Illegal activities violating local or international laws.</li>
          <li>Infringing intellectual property rights.</li>
          <li>Posting harmful, defamatory, or inappropriate content.</li>
          <li>Disrupting Platform operations or security.</li>
          <li>Sending unsolicited communications.</li>
          <li>Gathering competitive intelligence.</li>
          <li>Manipulating prices or reviews.</li>
          <li>Creating unauthorized multiple accounts.</li>
        </ul>
        <h3 className="text-xl font-medium mb-2">5.3 Consequences</h3>
        <p className="text-gray-700">
          Violations may lead to warnings, account suspension, termination, legal action, or reporting to authorities.
        </p>
      </div>

      {/* Section 6: Subscriptions and Pricing */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Subscriptions and Pricing</h2>
        <h3 className="text-xl font-medium mb-2">6.1 Subscription Models</h3>
        <p className="text-gray-700 mb-4">
          <strong>Free Subscription:</strong> Basic access, limited listings, standard support.<br />
          <strong>Premium Subscriptions:</strong> Unlimited listings, enhanced visibility, priority support, analytics, and marketing tools.
        </p>
        <h3 className="text-xl font-medium mb-2">6.2 Payment Terms</h3>
        <p className="text-gray-700">
          Fees are payable in advance in Indian Rupees (INR) via authorized channels, subject to GST. Subscriptions auto-renew unless cancelled.
        </p>
        <h3 className="text-xl font-medium mb-2 mt-4">6.3 Fee Changes</h3>
        <p className="text-gray-700">
          Huntsworld may modify fees with 30 days’ notice. Continued use constitutes acceptance of new pricing.
        </p>
      </div>

      {/* Section 7: Trend Points System */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Trend Points System</h2>
        <p className="text-gray-700 mb-4">
          Our proprietary Trend Points System ranks products based on user engagement, search relevance, and quality indicators, ensuring fair visibility without payment influence. No specific ranking positions are guaranteed.
        </p>
      </div>

      {/* Section 8: Referral Program */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Referral Program</h2>
        <p className="text-gray-700 mb-4">
          Eligible Users may earn rewards by sharing referral codes and bringing new Users. Rewards (credits, discounts, or cash) are distributed per program terms, with tax obligations on recipients. Huntsworld may modify or terminate programs with notice.
        </p>
      </div>

      {/* Section 9: Intellectual Property */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
        <p className="text-gray-700 mb-4">
          Huntsworld owns all Platform software, trademarks, and analytics. Users grant a non-exclusive, worldwide, royalty-free license to use their content for Platform operations. Users must respect intellectual property rights and report violations.
        </p>
      </div>

      {/* Section 10: Data Protection */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">10. Data Protection</h2>
        <p className="text-gray-700 mb-4">
          In compliance with the Digital Personal Data Protection Act, 2023, we collect and process data as outlined in our <a href="/privacy-policy" className="text-[#E33831] hover:underline">Privacy Policy</a>, with robust security measures and respect for User data rights.
        </p>
      </div>

      {/* Section 11: Payments and Compliance */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">11. Payments and Compliance</h2>
        <p className="text-gray-700 mb-4">
          Payments must use RBI-authorized gateways and comply with FEMA, KYC, AML, and GST regulations. Users are responsible for all applicable taxes and reporting.
        </p>
      </div>

      {/* Section 12: Refunds and Disputes */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">12. Refunds and Disputes</h2>
        <p className="text-gray-700 mb-4">
          <strong>Refunds:</strong> Free trial cancellations are fully refundable; premium subscriptions may receive pro-rated refunds within 7 days. Processing fees and promotional credits are non-refundable.<br />
          <strong>Disputes:</strong> Huntsworld mediates Buyer-Seller disputes but is not liable for outcomes. Users must provide evidence and attempt direct resolution first.
        </p>
      </div>

      {/* Section 13: Liability and Disclaimers */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">13. Liability and Disclaimers</h2>
        <p className="text-gray-700">
          The Platform is provided “as-is” without warranties. Huntsworld’s liability is limited to direct damages (up to fees paid in the prior 12 months). Users are responsible for due diligence and assume all risks of use.
        </p>
      </div>

      {/* Section 14: Indemnification */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">14. Indemnification</h2>
        <p className="text-gray-700">
          Users agree to indemnify Huntsworld against claims arising from their Platform use, violations of these Terms, or infringement of rights.
        </p>
      </div>

      {/* Section 15: Governing Law and Dispute Resolution */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">15. Governing Law and Dispute Resolution</h2>
        <p className="text-gray-700 mb-4">
          These Terms are governed by Indian law, with exclusive jurisdiction in Mumbai courts. Disputes will follow:
        </p>
        <ul className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Direct negotiation (30 days).</li>
          <li>Mediation (60 days).</li>
          <li>Binding arbitration under the Indian Arbitration and Conciliation Act, 2015.</li>
          <li>Court proceedings as a last resort.</li>
        </ul>
      </div>

      {/* Section 16: Account Termination */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">16. Account Termination</h2>
        <p className="text-gray-700">
          Users may terminate accounts with 30 days’ notice. Huntsworld may terminate accounts for violations, inactivity, or regulatory reasons. Terminated Users remain liable for outstanding obligations.
        </p>
      </div>

      {/* Section 17: Grievance Redressal */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">17. Grievance Redressal</h2>
        <p className="text-gray-700">
          Complaints can be filed with our Grievance Officer, who will acknowledge within 48 hours and resolve within 30 days. Contact: <a href="mailto:grievance@huntsworld.com" className="text-[#E33831] hover:underline">grievance@huntsworld.com</a>.
        </p>
      </div>

      {/* Section 18: Compliance */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">18. Regulatory Compliance</h2>
        <p className="text-gray-700">
          Huntsworld complies with the Consumer Protection (E-Commerce) Rules, 2020, Information Technology Act, 2000, FEMA, and other applicable Indian laws.
        </p>
      </div>

      {/* Section 19: Modifications */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">19. Modifications</h2>
        <p className="text-gray-700">
          Huntsworld may update these Terms, with changes posted on the Platform and communicated via email or notifications. Continued use constitutes acceptance.
        </p>
      </div>

      {/* Section 20: Force Majeure */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">20. Force Majeure</h2>
        <p className="text-gray-700">
          Huntsworld is not liable for delays or failures due to natural disasters, government actions, cyber attacks, or other uncontrollable events.
        </p>
      </div>

      {/* Section 21: Severability */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">21. Severability</h2>
        <p className="text-gray-700">
          If any provision is invalid, the remaining provisions remain in effect, modified to achieve the intended purpose where legally permissible.
        </p>
      </div>

      {/* Section 22: Entire Agreement */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">22. Entire Agreement</h2>
        <p className="text-gray-700">
          These Terms, alongside our Privacy Policy, constitute the entire agreement between Users and Huntsworld, superseding prior agreements.
        </p>
      </div>

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
        By using the Huntsworld Platform, you confirm that you have read, understood, and agree to these Terms and Conditions, and you have the authority to enter this agreement on behalf of your business entity, if applicable.
      </div>
    </div>
  );
};

export default TermsConditions;
