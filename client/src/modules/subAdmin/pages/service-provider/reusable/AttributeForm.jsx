import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle } from "lucide-react";

const AttributeForm = ({
  attributes,
  handleAttrChange,
  addAttribute,
  removeAttribute,
}) => {
  return (
    <div className="space-y-4">
      {attributes?.map((attr, index) => (
        <div key={index} className="flex gap-2 items-end">
          <div className="flex-1">
            <Label  className="mb-2">Key</Label>
            <Input
              placeholder="Color, Size, etc."
              value={attr?.key}
              onChange={(e) => handleAttrChange(index, "key", e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label className="mb-2">Value</Label>
            <Input
              placeholder="Red, XL, etc."
              value={attr.value}
              onChange={(e) => handleAttrChange(index, "value", e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => removeAttribute(index)}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addAttribute}
        className="flex items-center gap-2"
      >
        <PlusCircle className="w-4 h-4" />
        Add Attribute
      </Button>
    </div>
  );
};

export default AttributeForm;
