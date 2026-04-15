import React from "react";
import { ThumbsUp, Eye, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
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
      <div className="text-sm mt-10 text-gray-500 mb-2">
        <a href="/" className="text-gray-600">Home</a> / <a href="/about" className="text-[#E33831]">About Us</a>
      </div>

      {/* About Us Heading */}
      <h1 className="text-3xl font-bold mb-6">About Us</h1>

      {/* About Us Content */}
      <div className="space-y-4 text-justify text-gray-700">
        <p>
          Huntsworld is India’s most affordable B2B marketplace, designed to democratize business connections for companies of all sizes. We believe that every business, regardless of budget, deserves access to powerful marketplace tools and genuine growth opportunities.
        </p>
      </div>

      {/* Our Story Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Our Story</h2>
        <div className="bg-gray-100 p-5 rounded-lg shadow-lg">
          <p className="text-gray-700">
            Born from the frustration of watching small businesses struggle with expensive B2B platforms, Huntsworld was created to level the playing field. We saw talented entrepreneurs and quality manufacturers being overshadowed simply because they couldn’t afford premium visibility fees. That’s when we decided to build something different—a platform where merit matters more than money.
          </p>
        </div>
      </div>

      {/* What Makes Us Different Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">What Makes Us Different</h2>
        <div className="bg-gray-100 p-5 rounded-lg shadow-lg">
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Innovation Over Payment:</strong> Our revolutionary Trend Points System ranks products based on genuine user interest and engagement, not payment capacity. Quality products rise to the top naturally, giving every seller a fair chance to shine.
            </li>
            <li>
              <strong>Affordable Excellence:</strong> We offer comprehensive B2B marketplace features at a fraction of competitor pricing, making professional business tools accessible to startups, SMEs, and established enterprises alike.
            </li>
            <li>
              <strong>Rewards That Matter:</strong> From our unique viewpoint earnings system to student benefits and referral programs, we’ve created multiple ways for our community to grow and prosper together.
            </li>
          </ul>
        </div>
      </div>

      {/* Our Mission, Vision, Values, and Team Section */}
      <div className="mt-10 p-8 rounded-lg shadow-lg bg-[#FFE0E0]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Our Mission */}
          <div className="flex items-start space-x-6 p-5 rounded-lg">
            <ThumbsUp className="text-red-600 text-5xl" />
            <div>
              <h3 className="text-xl font-semibold">Our Mission</h3>
              <p className="text-gray-700">
                To build India’s most trusted and inclusive B2B ecosystem where businesses connect, collaborate, and grow based on value, not wallet size. We’re not just facilitating transactions—we’re fostering lasting business relationships that drive real growth.
              </p>
            </div>
          </div>

          {/* Our Vision */}
          <div className="flex items-start space-x-6 p-5 rounded-lg">
            <Eye className="text-red-600 text-5xl" />
            <div>
              <h3 className="text-xl font-semibold">Our Vision</h3>
              <p className="text-gray-700">
                To sow the seeds of par-excellence services with a customer-centric approach and reap the trust of worldwide clients.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="flex items-start space-x-6 p-5 rounded-lg">
            <CheckCircle className="text-red-600 text-5xl" />
            <div>
              <h3 className="text-xl font-semibold">Core Values</h3>
              <p className="text-gray-700">
                <strong>Transparency:</strong> Our words and actions always align, ensuring ethical, legal, and social correctness.
              </p>
              <p className="text-gray-700">
                <strong>Affordability:</strong> Providing high-quality tools and services at prices accessible to all businesses.
              </p>
              <p className="text-gray-700">
                <strong>Innovation:</strong> Continuously exploring new ways to enhance our platform and support our community’s growth.
              </p>
            </div>
          </div>

          {/* Our Team */}
          <div className="flex items-start space-x-6 p-5 rounded-lg">
            <Users className="text-red-600 text-5xl" />
            <div>
              <h3 className="text-xl font-semibold">Our Team</h3>
              <p className="text-gray-700">
                Our team is a blend of skilled professionals dedicated to empowering businesses. From developers to marketers, each member is committed to delivering solutions that drive success for our users.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Beyond the Marketplace Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Beyond the Marketplace</h2>
        <div className="bg-gray-100 p-5 rounded-lg shadow-lg">
          <p className="text-gray-700">
            Huntsworld is your complete business growth partner. Beyond our core marketplace, we offer:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Social media marketing services to amplify your reach.</li>
            <li>Professional website development to strengthen your digital presence.</li>
            <li>Comprehensive business support to help you succeed.</li>
          </ul>
        </div>
      </div>

      {/* Our Promise Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Our Promise</h2>
        <div className="shadow-lg rounded-lg p-10 max-w-8xl text-gray-700 italic text-lg text-center bg-white">
          Transparency. Affordability. Innovation. These aren’t just values—they’re our daily commitment to every business that trusts us with their growth journey.
        </div>
      </div>

      {/* Contact Us Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
        <div className="bg-gray-100 p-5 rounded-lg shadow-lg">
          <p className="text-gray-700">
            <strong>Email:</strong> <a href="mailto:hello@huntsworld.com" className="text-[#E33831]">hello@huntsworld.com</a>
          </p>
          <p className="text-gray-700">
            <strong>Phone:</strong> +91-XXXXXXXXXX
          </p>
          <p className="text-gray-700 mt-4 font-semibold">
            Ready to experience B2B commerce the way it should be? Join thousands of businesses already growing with Huntsworld.
          </p>
          <p className="text-gray-700 font-bold mt-2">
            Grow Smart. Grow Together. Grow with Huntsworld.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
