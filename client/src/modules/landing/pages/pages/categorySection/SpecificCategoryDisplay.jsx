



import React from "react";
import { categoryData } from "./data"; // import your data
import { ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export const categoryData = {
  category_name: "Electronics",
  subcategories: [
    {
      sub_category_name: "Mobiles",
      sub_category_image: "https://via.placeholder.com/100",
      super_sub_categories: [
        { super_sub_category_name: "Smartphones" },
        { super_sub_category_name: "Feature Phones" },
      ],
    },
    {
      sub_category_name: "Laptops",
      sub_category_image: "https://via.placeholder.com/100",
      super_sub_categories: [
        { super_sub_category_name: "Gaming Laptops" },
        { super_sub_category_name: "Business Laptops" },
      ],
    },
  ],
};

const CategoryDisplay = () => {
  const { category_name, subcategories } = categoryData;

  return (
    <div className="p-4 space-y-6">
      {/* Category Name Header */}
      <h1 className="text-3xl font-bold text-center text-purple-600">
        {category_name}
      </h1>

      {/* Subcategories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" >
        {subcategories.map((sub, index) => (
          <Card key={index} className="rounded-2xl shadow-md">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center space-x-4">
                <img
                  src={sub.sub_category_image}
                  alt={sub.sub_category_name}
                  className="w-16 h-16 rounded-full border"
                />
                <h2 className="text-xl font-semibold text-gray-800">
                  {sub.sub_category_name}
                </h2>
              </div>

              <div className="space-y-1 pl-2">
                {sub.super_sub_categories.map((superSub, i) => (
                  <Badge key={i} variant="outline" className="text-sm">
                    <ImageIcon className="w-4 h-4 mr-1" />
                    {superSub.super_sub_category_name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryDisplay;
