import { useState } from "react";
import { Button } from "@/components/ui/button";

const TestimonialForm = () => {
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validate input
    if (!description.trim()) {
      setMessage('Please enter a testimonial.');
      setIsLoading(false);
      return;
    }

    // Retrieve token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      setMessage('You must be logged in to submit a testimonial.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/testimonials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ description: description.trim() }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Testimonial submitted successfully!');
        setDescription('');
      } else {
        setMessage(result.message || 'Error submitting testimonial.');
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      setMessage('Failed to submit testimonial. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Write a Review</h3>
      {message && (
        <div className={`mb-4 p-2 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Your Testimonial
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows="4"
            placeholder="Write your testimonial here..."
            required
          ></textarea>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Submit Testimonial'}
        </Button>
      </div>
    </div>
  );
};

export default TestimonialForm;