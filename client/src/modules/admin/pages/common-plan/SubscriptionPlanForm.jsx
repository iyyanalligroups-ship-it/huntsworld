import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';

const SubscriptionPlanForm = ({ open, onClose, onSubmit, initialData }) => {
    const [form, setForm] = useState({
        name: '',
        category: '',
        durationType: '',
        durationValue: '',
        price: '',
        description: ''
    });

    useEffect(() => {
        if (initialData) {
            setForm(initialData);
        } else {
            setForm({
                name: '',
                category: '',
                durationType: '',
                durationValue: '',
                price: '',
                description: ''
            });
        }
    }, [initialData, open]);


    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-[#0c1f4d]">{initialData ? 'Update' : 'Create'} Subscription Plan</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit(form);
                    }}
                    className="space-y-3"
                >
                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="name">Plan Name</Label>
                        <Input id="name" name="name" placeholder="Plan Name" value={form.name} onChange={handleChange} required />
                    </div>

                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="category">Category</Label>
                        <Input id="category" name="category" placeholder="Category" value={form.category} onChange={handleChange} />
                    </div>

                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="durationType">Duration Type</Label>
                        <Input id="durationType" name="durationType" placeholder="Duration Type" value={form.durationType} onChange={handleChange} required />
                    </div>

                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="durationValue">Duration Value</Label>
                        <Input id="durationValue" name="durationValue" type="number" placeholder="Duration Value" value={form.durationValue} onChange={handleChange} />
                    </div>

                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="price">Price</Label>
                        <Input id="price" name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} required />
                    </div>

                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="description">Description</Label>
                        <Input id="description" name="description" placeholder="Description" value={form.description} onChange={handleChange} />
                    </div>

                    <Button type="submit" className="w-full bg-[#0c1f4d] hover:bg-[#0c1f4dcb] cursor-pointer">{initialData ? 'Update' : 'Create'}</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default SubscriptionPlanForm;