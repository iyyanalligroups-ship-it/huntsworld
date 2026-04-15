import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  BookOpen,
  Megaphone,
  Eye,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { Link } from "react-router-dom";
import '../styles/_theme.scss'

const features = [
  {
    icon: <BookOpen className="w-10 h-10 text-gray-500" />,
    title: "Mini Catalog",
    description: "Create & Manage your",
  },
  {
    icon: <Megaphone className="w-10 h-10 text-gray-500" />,
    title: "Advertise",
    description: "Advertise your Company & Products",
  },
  {
    icon: <Eye className="w-10 h-10 text-gray-500" />,
    title: "Exposure",
    description: "Get Maximum",
  },
  {
    icon: <TrendingUp className="w-10 h-10 text-gray-500" />,
    title: "Ranking",
    description: "Achieve Higher",
  },
  {
    icon: <ShoppingCart className="w-10 h-10 text-gray-500" />,
    title: "Quotes",
    description: "Get Max. Buying",
  },
];

const Help = () => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header Section */}
      <motion.div
        className=" h-52 flex justify-center items-center shadow-md bg-[#1C1B1F]"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h3 className="text-2xl font-semibold text-white">
          We're here to assist you.
        </h3>
      </motion.div>

      {/* FAQ Cards */}
      <div className="flex justify-center gap-6 py-10">
        {/* Buyer FAQ Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="w-80 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex items-center gap-2">
              <User  style={{ color: "var(--tertiary-color)" }} size={32} />
              <CardTitle>Buyer FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Search, choose, and shortlist the goods or services you want
                with the help of these questions and answers.
              </p>
              <Link to="/buyer-faq">
                <Button className="mt-4 cursor-pointer" variant="outline">
                  Know More
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Seller FAQ Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="w-80 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex items-center gap-2">
              <ShoppingCart style={{ color: "var(--tertiary-color)" }} size={32} />
              <CardTitle>Seller FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Questions and answers to help you find leads, advertise
                products, and expand your company.
              </p>
              <Link to="/seller-faq">
                <Button className="mt-4 cursor-pointer" variant="outline">
                  Know More
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Business Growth Section */}
      <motion.div
        className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-white to-blue-50 shadow-xl rounded-xl mx-6 "
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800 tracking-wide">
          How to Grow your Business as{" "}
          <a href="#" style={{color:`var( --neutral-color)`}} className="hover:underline">
            Premium Supplier?
          </a>
        </h2>

        <motion.div
          className="flex flex-wrap justify-center gap-16 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center text-gray-700 transition-all duration-300 hover:scale-105 hover:rotate-1"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="p-4 bg-white shadow-md rounded-full">
                {feature.icon}
              </div>
              <p className="text-sm mt-3">
                {feature.description}{" "}
                <strong className="text-black">{feature.title}</strong>
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div >
          <Link to="#">
            <Button
       
             className="w-full bg-[#e03733]  hover:shadow-lg text-white py-2 rounded-md cursor-pointer"
            >
              I am Interested
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Help;
