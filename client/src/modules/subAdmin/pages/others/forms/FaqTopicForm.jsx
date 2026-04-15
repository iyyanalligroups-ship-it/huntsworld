// components/FaqForm.jsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateFaqTopicMutation, useUpdateFaqTopicMutation } from "@/redux/api/FAQapi";
import showToast from "@/toast/showToast";

export function FaqTopicForm({ selectedTopic, onSuccess }) {
    const [title, setTitle] = useState("");
    const [role, setRole] = useState("both");
    const [createFaqTopic] = useCreateFaqTopicMutation();
    const [updateFaqTopic] = useUpdateFaqTopicMutation();

    useEffect(() => {
        if (selectedTopic) {
            setTitle(selectedTopic.title);
            setRole(selectedTopic.role);
        } else {
            setTitle("");
            setRole("both");
        }
    }, [selectedTopic]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = { title, role };

        try {
            if (selectedTopic) {
                const response = await updateFaqTopic({ id: selectedTopic._id, ...data }).unwrap();
                if (response) {
                    console.log(response);
                showToast(response.message || "Faq Topic Updated Successfully",'success');
                    
                } else {
                    showToast(response.message || "Failed to Update Faq Topic",'error');
                }
            } else {
                const response = await createFaqTopic(data).unwrap();
                if (response) {
                    console.log(response);
                showToast(response.message || "Faq Topic Created Successfully",'success');
                    
                } else {
                    showToast(response.message || "Failed to Create Faq Topic",'error');
                }
            }
            onSuccess();
            setTitle("");
            setRole("both");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label className="mb-2">Topic Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
                <Label className="mb-2">Role</Label>
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-full border rounded-md p-2">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit">
                {selectedTopic ? "Update Topic" : "Add Topic"}
            </Button>
        </form>
    );
} 