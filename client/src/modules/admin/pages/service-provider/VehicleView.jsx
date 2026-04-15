import React from "react";
import { ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const VehicleView = ({ provider, handleBack }) => {
  // Debug log to check provider.vehicles data
  console.log("Provider vehicles:", provider?.vehicles);

  return (
    <>
      <div className="flex items-center mb-4">
        <button
          onClick={handleBack}
          className="flex items-center text-[#32242C] hover:text-[#e03733]"
        >
          <ArrowLeft className="w-5 h-5 mr-2 text-[#32242C]" />
          Back to Details
        </button>
      </div>
      <h2 className="text-xl font-bold text-black mb-4">Vehicles</h2>
      <div className="space-y-6">
        {/* Grid View: Only shown if vehicles exist */}
        {provider?.vehicles?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {provider.vehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white p-4 rounded-md shadow-sm">
                <p className="text-black font-medium">
                  <Truck className="w-4 h-4 inline mr-2 text-[#32242C]" />
                  Type: {vehicle.type || "N/A"}
                </p>
                <p className="text-black">Capacity: {vehicle.capacity || "N/A"} seats</p>
                <p className="text-black">Registration: {vehicle.registration || "N/A"}</p>
              </div>
            ))}
          </div>
        )}
        {/* Table View: Always shown */}
        <div className="overflow-x-auto rounded-md shadow-sm">
          <Table className="min-w-full bg-white">
            <TableHeader className="bg-black">
              <TableRow className="hover:bg-black">
                <TableHead className="text-white text-sm font-semibold">Vehicle Name</TableHead>
                <TableHead className="text-white text-sm font-semibold">Category</TableHead>
                <TableHead className="text-white text-sm font-semibold">Subcategory</TableHead>
                <TableHead className="text-white text-sm font-semibold">Supersubcategory</TableHead>
                <TableHead className="text-white text-sm font-semibold">Deepsubcategory</TableHead>
                <TableHead className="text-white text-sm font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {provider?.vehicles?.length > 0 ? (
                provider.vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="border-b hover:bg-gray-100">
                    <TableCell className="p-3 text-sm text-black">{vehicle.type || "N/A"}</TableCell>
                    <TableCell className="p-3 text-sm text-black">{vehicle.category || "N/A"}</TableCell>
                    <TableCell className="p-3 text-sm text-black">{vehicle.subcategory || "N/A"}</TableCell>
                    <TableCell className="p-3 text-sm text-black">{vehicle.supersubcategory || "N/A"}</TableCell>
                    <TableCell className="p-3 text-sm text-black">{vehicle.deepsubcategory || "N/A"}</TableCell>
                    <TableCell className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log(`View vehicle ${vehicle.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log(`Edit vehicle ${vehicle.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => console.log(`Delete vehicle ${vehicle.id}`)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="p-3 text-center text-sm text-black">
                    No vehicles available for this provider.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default VehicleView;