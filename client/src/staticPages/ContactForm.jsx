"use client";

import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, Phone, Clock, CalendarIcon } from "lucide-react";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const ContactForm = () => {
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    time: "",
    date: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* -----------------------------------
     Helpers
  ----------------------------------- */

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone) =>
    /^[0-9]{10}$/.test(phone);

  const isPastTimeForToday = (date, time) => {
    if (!date || !time) return false;

    const todayStr = new Date().toISOString().split("T")[0];
    if (date !== todayStr) return false;

    const now = new Date();
    const [t, modifier] = time.split(" ");
    let [hours, minutes] = t.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const selectedTime = new Date();
    selectedTime.setHours(hours, minutes, 0, 0);

    return selectedTime <= now;
  };

  /* -----------------------------------
     Handle change
  ----------------------------------- */

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  /* -----------------------------------
     Submit
  ----------------------------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    if (!formData.date) {
      newErrors.date = "Please select a date";
    }

    if (!formData.time) {
      newErrors.time = "Please select a time";
    } else if (isPastTimeForToday(formData.date, formData.time)) {
      newErrors.time = "Past time is not allowed for today";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/contact/create-contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Submission failed");

      showToast("We'll reach you soon!", "success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        time: "",
        date: "",
      });
    } catch (error) {
      showToast("Failed to submit form. Try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -----------------------------------
     Time slots
  ----------------------------------- */

  const generateTimeSlots = (start = "09:00", end = "18:00", interval = 60) => {
    const slots = [];
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    let current = new Date();
    current.setHours(sh, sm, 0, 0);

    const endTime = new Date();
    endTime.setHours(eh, em, 0, 0);

    while (current <= endTime) {
      let hours = current.getHours();
      const minutes = current.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;

      slots.push(
        `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`
      );

      current.setMinutes(current.getMinutes() + interval);
    }

    return slots;
  };

  const timeOptions = generateTimeSlots();

  /* -----------------------------------
     UI
  ----------------------------------- */

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Contact Us</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <Label className="mb-2"><User className="inline w-4 h-4 mr-2" />Name</Label>
          <Input name="name" value={formData.name} placeholder="Enter the name" onChange={handleChange} />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <Label className="mb-2"><Mail className="inline w-4 h-4 mr-2" />Email</Label>
          <Input name="email" value={formData.email} placeholder="Enter the email" onChange={handleChange} />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <Label className="mb-2"><Phone className="inline w-4 h-4 mr-2" />Phone</Label>
          <Input
            name="phone"
            placeholder="Enter the number"
            value={formData.phone}
            onChange={handleChange}
            maxLength={10}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* Time */}
        <div>
          <Label className="mb-2"><Clock className="inline w-4 h-4 mr-2" />Preferred Time</Label>
          <select
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full border rounded-md p-2"
          >
            <option value="">Select time</option>
            {timeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
        </div>

        {/* Date */}
        <div>
          <Label className="mb-2"><CalendarIcon className="inline w-4 h-4 mr-2" />Preferred Date</Label>
          <Input
            type="date"
            name="date"
            value={formData.date}
            min={new Date().toISOString().split("T")[0]}
            onChange={handleChange}
          />
          {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
        </div>

        <Button className="w-full cursor-pointer" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;
