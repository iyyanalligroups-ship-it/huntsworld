import { useGetAllMerchantsQuery } from '@/redux/api/SubDealerApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const MerchantSelect = ({ nextStep, updateFormData, formData }) => {
  const { data, isLoading, isError } = useGetAllMerchantsQuery();
  const merchants = data?.data?.filter(m => m._id && m.name) || [];

  const handleChange = (merchantId) => {
    updateFormData({ merchant_id: merchantId });
  };

  const handleNext = () => {
    if (!formData.merchant_id) {
      alert('Please select a merchant.');
      return;
    }
    nextStep();
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto p-4 sm:p-6 md:p-8">
      {/* max-w-lg centers the form with a max width, mx-auto ensures horizontal centering, responsive padding */}
      <Label className="text-base sm:text-lg font-medium">
        Select Merchant
      </Label>
      {isLoading ? (
        <p className="text-sm sm:text-base text-gray-500">
          Loading merchants...
        </p>
      ) : isError ? (
        <p className="text-sm sm:text-base text-red-500">
          Failed to load merchants.
        </p>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Use flex-col for vertical stacking, gap for consistent spacing */}
          <Select
            onValueChange={handleChange}
            value={formData.merchant_id || ''}
            className="w-full"
          >
            <SelectTrigger className="w-full text-sm sm:text-base py-2 sm:py-3">
              {/* Responsive text size and padding */}
              <SelectValue placeholder="-- Select Merchant --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-- Select Merchant --</SelectItem>
              {merchants.map((m) => (
                <SelectItem key={m._id} value={m._id} className="text-sm sm:text-base">
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="w-full sm:w-auto px-6 py-2 sm:py-3 text-sm sm:text-base cursor-pointer bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
            onClick={handleNext}
            disabled={!formData.merchant_id}
          >
            {/* w-full on mobile, sm:w-auto on larger screens, responsive padding and text */}
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default MerchantSelect;