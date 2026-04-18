import React from "react";
import { ArrowLeft, Trash2, Mail, Settings, ShieldAlert, User, Briefcase, GraduationCap, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const DeleteAccountPage = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Common User",
            icon: <User className="w-6 h-6 text-blue-500" />,
            instruction: "Navigate to Dashboard > Settings > Deactivate Account. Follow the prompts to permanently delete your data.",
        },
        {
            title: "Merchant / Seller",
            icon: <Store className="w-6 h-6 text-green-500" />,
            instruction: "Go to Merchant Dashboard > Account Settings. You will find the 'Deactivate Account' option there. Deleting your account will remove all your listings and shop data.",
        },
        {
            title: "Student",
            icon: <GraduationCap className="w-6 h-6 text-orange-500" />,
            instruction: "Visit Student Dashboard > Settings. Locate the deactivation section to proceed with account removal.",
        },
        {
            title: "Base Member / Grocery Seller",
            icon: <Briefcase className="w-6 h-6 text-purple-500" />,
            instruction: "Access your dashboard settings and select 'Deactivate Account' to start the deletion process.",
        }
    ];

    return (
        <div className="bg-white min-h-screen relative text-black py-16 px-5 lg:px-20 font-sans">
            {/* Navigation */}
            <div className="max-w-4xl mx-auto">
                <Button
                    type="button"
                    onClick={() => navigate(-1)}
                    variant="ghost"
                    className="mb-8 flex items-center gap-2 hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Button>

                <div className="text-sm text-gray-500 mb-4">
                    <a href="/" className="hover:text-primary">Home</a> / <span className="text-[#E33831] font-medium">Delete Account</span>
                </div>

                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Account Deletion Instructions</h1>
                    <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                        We are sorry to see you go. If you wish to delete your Huntsworld account, please follow the instructions below based on your account type.
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {sections.map((section, index) => (
                        <div key={index} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                    {section.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">{section.title}</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                {section.instruction}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Email Option */}
                <div className="bg-[#FFF1F1] rounded-3xl p-8 md:p-12 mb-12 border border-red-100 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="p-5 bg-white rounded-2xl shadow-lg border border-red-50">
                            <Mail className="w-10 h-10 text-[#E33831]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Alternative: Request via Email</h2>
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                If you are unable to access your dashboard or prefer manual deletion, please email our support team. We will process your request within 48-72 hours.
                            </p>
                            <a 
                                href="mailto:contact@huntsworld.com" 
                                className="inline-flex items-center gap-2 bg-[#E33831] text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200"
                            >
                                <Mail className="w-5 h-5" />
                                contact@huntsworld.com
                            </a>
                        </div>
                    </div>
                </div>

                {/* Warning Section */}
                <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-4">
                        <ShieldAlert className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-amber-900 mb-2 italic underline underline-offset-4">Important Notice</h4>
                            <p className="text-amber-800 text-sm leading-relaxed">
                                Account deletion is <span className="font-bold">permanent and irreversible</span>. Once your account is deleted, all your data, including profile information, order history, active listings, and earned points, will be permanently removed and cannot be recovered.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-16 pt-8 border-t border-gray-100 text-center">
                    <p className="text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} Huntsworld. All rights reserved. 
                        Need help? <a href="/contact" className="text-primary hover:underline">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountPage;
