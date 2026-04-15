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
    <div className="space-y-4">
      <Label>Select Merchant</Label>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading merchants...</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Failed to load merchants.</p>
      ) : (
        <>
          <Select onValueChange={handleChange} value={formData.merchant_id || ''}>
            <SelectTrigger className="w-full border-2 border-slate-300">
              <SelectValue placeholder="-- Select Merchant --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-- Select Merchant --</SelectItem>
              {merchants.map((m) => (
                <SelectItem key={m._id} value={m._id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={handleNext}
            disabled={!formData.merchant_id}
          >
            Next
          </Button>
        </>
      )}
    </div>
  );
};

export default MerchantSelect;