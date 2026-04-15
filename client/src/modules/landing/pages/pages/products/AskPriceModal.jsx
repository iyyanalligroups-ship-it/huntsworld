import { useState, useContext, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const AskPriceModal = ({ isOpen, onClose, product }) => {
    const { user } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        reason: "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.user) {
            setFormData(prev => ({
                ...prev,
                name: user.user.name || prev.name,
                phone: user.user.phone || prev.phone,
                email: user.user.email || prev.email,
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.reason) {
            showToast("Please fill in all required fields", "error");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                product_id: product?._id,
                user_id: user?.user?._id || null,
            };

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/ask-price/submit`, payload);

            if (res.data.success) {
                showToast("Price request sent successfully!", "success");
                onClose();
                setFormData({ name: "", phone: "", email: "", reason: "" });
            } else {
                showToast(res.data.message || "Failed to submit request", "error");
            }
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || "An error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-[#0c1f4d]">Request Price</DialogTitle>
                    <DialogDescription>
                        Submit your details and we will get back to you with the price for <strong>{product?.product_name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="1234567890"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address <span className="text-gray-400 text-xs">(optional)</span></Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason / Message <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="reason"
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            placeholder="E.g. I need pricing for a bulk order of 100 units."
                            rows={3}
                            required
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-[#0c1f4d] text-white hover:bg-red-600" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Request Price"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AskPriceModal;
