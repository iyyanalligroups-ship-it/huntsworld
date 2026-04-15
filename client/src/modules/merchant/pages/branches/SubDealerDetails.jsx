import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useGetUserByIdQuery } from '@/redux/api/SubDealerApi';
import { Loader2 } from 'lucide-react';

const SubDealerDetails = ({ subDealer }) => {
  console.log('SubDealer:', subDealer);

  // Fetch user details
  const {
    data: userData,
    isLoading: userLoading,
    isError: userError,
  } = useGetUserByIdQuery(subDealer?.user_id, { skip: !subDealer?.user_id });

  // Fetch merchant details
  const {
    data: merchantData,
    isLoading: merchantLoading,
    isError: merchantError,
  } = useGetUserByIdQuery(subDealer?.merchant_id, { skip: !subDealer?.merchant_id });
console.log(merchantData,"merchant data");

  // Fallback for missing data
  const user = userData?.user || { name: 'N/A', email: 'N/A', phone_number: 'N/A', role: { name: 'N/A' } };
  const merchant = merchantData?.user || { name: 'N/A', phone: 'N/A' };
  const address = subDealer?.address || {
    address_line_1: 'N/A',
    address_line_2: '',
    city: 'N/A',
    state: 'N/A',
    country: 'N/A',
    pincode: 'N/A',
  };
  const products = subDealer?.products || [];

  return (
    <div className="space-y-6">
      {/* Company Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Company Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            {subDealer?.company_logo && (
              <Avatar className="h-16 w-16">
                <AvatarImage src={subDealer.company_logo} alt="Company Logo" />
                <AvatarFallback>{subDealer.company_name?.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <h3 className="text-lg font-semibold">{subDealer?.company_name || 'N/A'}</h3>
              <p className="text-sm text-muted-foreground">{subDealer?.description || 'No description available'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{subDealer?.company_email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Phone Number</p>
              <p className="text-sm text-muted-foreground">{subDealer?.company_phone_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">GST Number</p>
              <p className="text-sm text-muted-foreground">{subDealer?.gst_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">PAN</p>
              <p className="text-sm text-muted-foreground">{subDealer?.pan || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Aadhar</p>
              <p className="text-sm text-muted-foreground">{subDealer?.aadhar || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Company Type</p>
              <p className="text-sm text-muted-foreground">{subDealer?.company_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">MSME Certificate</p>
              <p className="text-sm text-muted-foreground">{subDealer?.msme_certificate_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Employees</p>
              <p className="text-sm text-muted-foreground">{subDealer?.number_of_employees || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Established</p>
              <p className="text-sm text-muted-foreground">{subDealer?.year_of_establishment || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          {userLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="ml-2 text-sm text-muted-foreground">Loading user details...</p>
            </div>
          ) : userError ? (
            <p className="text-sm text-red-500">Failed to load user details</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-sm text-muted-foreground">{user.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground">{user.role?.role || 'N/A'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium">Address Line 1</p>
            <p className="text-sm text-muted-foreground">{address.address_line_1}</p>
            {address.address_line_2 && (
              <>
                <p className="text-sm font-medium">Address Line 2</p>
                <p className="text-sm text-muted-foreground">{address.address_line_2}</p>
              </>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">City</p>
                <p className="text-sm text-muted-foreground">{address.city}</p>
              </div>
              <div>
                <p className="text-sm font-medium">State</p>
                <p className="text-sm text-muted-foreground">{address.state}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Country</p>
                <p className="text-sm text-muted-foreground">{address.country}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Pincode</p>
                <p className="text-sm text-muted-foreground">{address.pincode}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Merchant Details */}
      <Card>
        <CardHeader>
          <CardTitle>Merchant Details</CardTitle>
        </CardHeader>
        <CardContent>
          {merchantLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="ml-2 text-sm text-muted-foreground">Loading merchant details...</p>
            </div>
          ) : merchantError ? (
            <p className="text-sm text-red-500">Failed to load merchant details</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Merchant Name</p>
                <p className="text-sm text-muted-foreground">{merchant.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Merchant Phone</p>
                <p className="text-sm text-muted-foreground">{merchant.phone}</p>
              </div>
          
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.name || 'N/A'}</TableCell>
                    <TableCell>{product.description || 'N/A'}</TableCell>
                    <TableCell>{product.price ? `$${product.price}` : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No products available</p>
          )}
        </CardContent>
      </Card>

      {/* Company Images */}
      <Card>
        <CardHeader>
          <CardTitle>Company Images</CardTitle>
        </CardHeader>
        <CardContent>
          {subDealer?.company_images && subDealer.company_images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {subDealer.company_images.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Company image ${index + 1}`}
                  className="h-32 w-full object-cover rounded-md"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No images available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubDealerDetails;