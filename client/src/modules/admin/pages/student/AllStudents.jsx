
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlusCircle, RefreshCw, MoreVertical } from 'lucide-react';
import AddStudentModal from './AddStudent';
import DeleteDialog from '@/model/DeleteModel';
import showToast from '@/toast/showToast';


function AllStudents() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    user_id: '',
    college_email: '',
    id_card: '',
    address_id: '',
    college_name: '',
    university_name: '',
    verified: false,
    expiry_date: '',
    address_type: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const itemsPerPage = 10;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedCollegeName, setSelectedCollegeName] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(student =>
      student.college_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user_id.toString().includes(searchTerm)
    );
    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/students/fetch-students`);
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleViewDetails = async (studentId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/students/fetch-students-by-id/${studentId}`);
      setSelectedStudent(response.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  const handleEdit = async (studentId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/students/fetch-students-by-id/${studentId}`);
      const student = response.data;
      setFormData({
        _id: student._id || '',
        user_id: student.user_id || '',
        college_email: student.college_email || '',
        id_card: student.id_card || '',
        address_id: student.address_id || '',
        college_name: student.college_name || '',
        university_name: student.university_name || '',
        verified: student.verified || false,
        expiry_date: student.expiry_date ? new Date(student.expiry_date).toISOString().split('T')[0] : '',
        address_type: student.address?.address_type || '',
        address_line_1: student.address?.address_line_1 || '',
        address_line_2: student.address?.address_line_2 || '',
        city: student.address?.city || '',
        state: student.address?.state || '',
        country: student.address?.country || '',
        pincode: student.address?.pincode || '',
      });
      setIsEditMode(true);
      setIsAddModalOpen(true);
    } catch (error) {
      console.error('Error fetching student for edit:', error);
    }
  };
  // ✅ Toggle student verified status
  const handleToggleStatus = async (student) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/students/toggle/${student._id}`
      );

      if (response.data.success) {
        // Update verified status locally
        setFilteredStudents((prevStudents) =>
          prevStudents.map((s) =>
            s._id === student._id ? { ...s, verified: response.data.verified } : s
          )
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  const confirmDelete = (studentId,user_id, addressId, collegeName, student) => {
    console.log(studentId,user_id, addressId, collegeName, student.college_name, 'delet');

    setSelectedStudentId(studentId);
    setSelectedAddressId(addressId);
    setSelectedCollegeName(student.college_name);
    setSelectedUserId(user_id)
    setIsDeleteDialogOpen(true);
  };


  const handleConfirmDelete = async () => {
    try {
      // 1. Delete student
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/students/delete-students-by-id/${selectedStudentId}`
      );
      showToast("Student deleted successfully", "success");

      // 2. Delete associated address
      if (selectedAddressId) {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/address/delete-address-addressId-userId/${selectedUserId}/${selectedAddressId}`
        );
        showToast("Address deleted successfully", "success");
      }

      // 3. Delete associated ID card image
      if (selectedCollegeName) {
        await axios.post(
          `${import.meta.env.VITE_API_IMAGE_URL}/student-images/id-card/delete`,
          { collage_name: selectedCollegeName }
        );
        showToast("ID card image deleted successfully", "success");
      }

      // 4. Refresh and reset
      fetchStudents();
      setIsDeleteDialogOpen(false);
      setSelectedStudentId(null);
      setSelectedAddressId(null);
      setSelectedCollegeName(null);
    } catch (error) {
      console.error("Error deleting student, address or ID card image:", error);
      showToast("Failed to delete student, address, or ID card image", "error");
    }
  };

  // const handleDelete = async (studentId) => {
  //   try {
  //     await axios.delete(`${import.meta.env.VITE_API_URL}/students/delete-students-by-id/${studentId}`);
  //     fetchStudents();
  //   } catch (error) {
  //     console.error('Error deleting student:', error);
  //   }
  // };

  const validateForm = () => {
    const errors = {};
    if (!formData.user_id) errors.user_id = 'User ID is required';
    if (!formData.college_email) errors.college_email = 'College email is required';
    if (!formData.id_card) errors.id_card = 'ID card is required';
    if (!formData.address_id) errors.address_id = 'Address ID is required';
    if (!formData.college_name) errors.college_name = 'College name is required';
    if (!formData.university_name) errors.university_name = 'University name is required';
    if (!formData.expiry_date) errors.expiry_date = 'Expiry date is required';
    if (!formData.address_type) errors.address_type = 'Address type is required';
    if (!formData.address_line_1) errors.address_line_1 = 'Address line 1 is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.state) errors.state = 'State is required';
    if (!formData.country) errors.country = 'Country is required';
    if (!formData.pincode) errors.pincode = 'Pincode is required';
    return errors;
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (isEditMode) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/students/update-students-by-id/${formData._id}`,
          {
            user_id: formData.user_id,
            college_email: formData.college_email,
            id_card: formData.id_card,
            address_id: formData.address_id,
            college_name: formData.college_name,
            university_name: formData.university_name,
            verified: formData.verified,
            expiry_date: formData.expiry_date,
          }
        );

        setStudents(prev =>
          prev.map(student =>
            student._id === formData._id ? { ...student, ...formData } : student
          )
        );
        setFilteredStudents(prev =>
          prev.map(student =>
            student._id === formData._id ? { ...student, ...formData } : student
          )
        );

        showToast("Student updated successfully", "success");
      } else {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/students/create-students`,
          {
            user_id: formData.user_id,
            college_email: formData.college_email,
            id_card: formData.id_card,
            address_id: formData.address_id,
            college_name: formData.college_name,
            university_name: formData.university_name,
            verified: formData.verified,
            expiry_date: formData.expiry_date,
          }
        );

        const newStudent = response.data;
        setStudents(prev => [...prev, newStudent]);
        setFilteredStudents(prev => [...prev, newStudent]);

        showToast("Student added successfully", "success");
      }

      setIsAddModalOpen(false);
      resetFormFields();
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving student:", error);
      setFormErrors({
        submit: error.response?.data?.message || "Failed to save student",
      });
      showToast(error.response?.data?.message || "Failed to save student", "error");
      await fetchStudents();
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    resetFormFields();
    setIsEditMode(false);
  };

  const resetFormFields = () => {
    setFormErrors({});
    setFormData({
      _id: '',
      user_id: '',
      college_email: '',
      id_card: '',
      address_id: '',
      college_name: '',
      university_name: '',
      verified: false,
      expiry_date: '',
      address_type: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 relative">
      <div className="flex items-center mb-4 space-x-4">
        <Input
          type="text"
          placeholder="Search by email or ID..."
          className="w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center bg-[#1c1b20] hover:bg-[#c0302c] text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Students
        </Button>
        <Button
          onClick={fetchStudents}
          className="flex items-center bg-[#1c1b20] hover:bg-[#c0302c] text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="relative">
        <Table className="z-10">
          <TableHeader>
            <TableRow className="bg-black hover:bg-black">
              <TableHead className="text-white">S.No</TableHead>
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">College Email</TableHead>
              <TableHead className="text-white">Verified</TableHead>
              <TableHead className="text-white">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((student, index) => (
                <TableRow key={student._id} className="bg-white hover:bg-white">
                  <TableCell className="text-black">{indexOfFirstItem + index + 1}</TableCell>
                  <TableCell className="text-black">{student.user_id}</TableCell>
                  <TableCell className="text-black">{student.college_email}</TableCell>
                  <TableCell>
                <Switch
                  checked={student.verified}
                  onCheckedChange={() => handleToggleStatus(student)}
                  className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600"
                  thumbIcon={
                    student.verified ? (
                      <ToggleRight className="h-4 w-4 text-white" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-white" />
                    )
                  }
                />
              </TableCell>
                  <TableCell className="text-black">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertical className="h-5 w-5 text-gray-600" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleViewDetails(student._id)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(student._id)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => confirmDelete(student._id, student.user_id, student.address_id,
                            student.collage_name, student)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="bg-white hover:bg-white">
                <TableCell colSpan={5} className="text-center py-4 text-black">
                  No students found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Student Details</h2>
            <p><strong>User ID:</strong> {selectedStudent.user_id}</p>
            <p><strong>College Email:</strong> {selectedStudent.college_email}</p>
            <p><strong>College Name:</strong> {selectedStudent.college_name}</p>
            <p><strong>University:</strong> {selectedStudent.university_name}</p>
            <p><strong>Verified:</strong> {selectedStudent.verified ? 'Yes' : 'No'}</p>
            <p><strong>Expiry Date:</strong> {new Date(selectedStudent.expiry_date).toLocaleDateString()}</p>
            <Button
              className="mt-4 bg-[#1c1b20] hover:bg-[#c0302c] text-white"
              onClick={() => setSelectedStudent(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddStudent}
        onResetForm={resetFormFields}
        formData={formData}
        formErrors={formErrors}
        onInputChange={handleInputChange}
        isEditMode={isEditMode}
      />
      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Are you sure you want to delete this student?"
        description="This action will delete the student, their address, and their ID card image. It cannot be undone."
      />
    </div>
  );
}

export default AllStudents;
