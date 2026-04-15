import { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateFaqQuestionMutation, useUpdateFaqQuestionMutation, useGetFaqTopicsForQuestionsQuery } from "@/redux/api/FAQapi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";

export function FaqQuestionForm({ selectedQuestions, onSuccess }) {
  const { user } = useContext(AuthContext);

  console.log("selectedQuestions:", selectedQuestions);

  const [formData, setFormData] = useState({
    topicId: "",
    question: "",
    answer: "",
    role: "both",
    isPublished: false,
    askedBy: user?.user?._id || ""
  });
  const [selectedType, setSelectedType] = useState("");

  const { data: topics = { data: [] }, isLoading } = useGetFaqTopicsForQuestionsQuery({ type: selectedType }, { skip: !selectedType });
  const [createQuestion] = useCreateFaqQuestionMutation();
  const [updateQuestion] = useUpdateFaqQuestionMutation();

  useEffect(() => {
    if (selectedQuestions) {
      const newFormData = {
        topicId: selectedQuestions.topicId?._id || "",
        question: selectedQuestions.question || "",
        answer: selectedQuestions.answer || "",
        role: selectedQuestions.role || "both",
        isPublished: !!selectedQuestions.isPublished,
        askedBy: selectedQuestions.askedBy || user?.user?._id || ""
      };
      console.log("Patching formData:", newFormData);
      setFormData(newFormData);
      setSelectedType(selectedQuestions.role || "");
    }
  }, [selectedQuestions, user]);

  useEffect(() => {
    console.log("formData changed:", formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value ?? ""
    });
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    setFormData({ ...formData, topicId: "", role: value });
  };

  const handleTopicChange = (value) => {
    setFormData({ ...formData, topicId: value ?? "" });
  };

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value ?? "both" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedQuestions) {
        const response = await updateQuestion({ id: selectedQuestions._id, ...formData }).unwrap();
        showToast(response.message || "Faq Question Updated Successfully",'success');
      } else {
        const response = await createQuestion(formData).unwrap();
        showToast(response.message || "Faq Question Created Successfully",'success');
      }
      onSuccess();
      setFormData({
        topicId: "",
        question: "",
        answer: "",
        role: "both",
        isPublished: false,
        askedBy: user?.user?._id || ""
      });
      setSelectedType("");
    } catch (error) {
      showToast(error?.data?.message || "Failed to save FAQ Question");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="mb-2">Select FAQ Type</Label>
        <Select value={selectedType || ""} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buyer">Buyer</SelectItem>
            <SelectItem value="seller">Seller</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2">Topic</Label>
        <Select
          value={formData.topicId || ""}
          onValueChange={handleTopicChange}
          disabled={!selectedType || isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Topic" />
          </SelectTrigger>
          <SelectContent>
            {topics.data.map((t) => (
              <SelectItem key={t._id} value={t._id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2">Question</Label>
        <Input
          name="question"
          value={formData.question || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label className="mb-2">Answer</Label>
        <Textarea
          name="answer"
          value={formData.answer || ""}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label className="mb-2">Role</Label>
        <Select value={formData.role || "both"} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">Both</SelectItem>
            <SelectItem value="buyer">Buyer</SelectItem>
            <SelectItem value="seller">Seller</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="isPublished"
          checked={formData.isPublished}
          onChange={handleChange}
        />
        <Label>Publish</Label>
      </div>

      <Button type="submit">{selectedQuestions ? "Update" : "Create"} Question</Button>
    </form>
  );
}