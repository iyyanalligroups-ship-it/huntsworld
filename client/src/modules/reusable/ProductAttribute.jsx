import { Input } from "@/components/ui/input";

export default function AttributeInput({ index, attr, handleChange, removeField }) {
  return (
    <div className="flex gap-4 items-center mb-2">
      <Input
        placeholder="Key"
        value={attr.attribute_key}
        onChange={(e) => handleChange(index, "attribute_key", e.target.value)}
      />
      <Input
        placeholder="Value"
        value={attr.attribute_value}
        onChange={(e) => handleChange(index, "attribute_value", e.target.value)}
      />
      {index >= 5 && (
        <button
          className="text-red-500 text-sm"
          type="button"
          onClick={() => removeField(index)}
        >
          Remove
        </button>
      )}
    </div>
  );
}
