import React from 'react'
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import ReferralList from './ReferralList';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Referral = () => {
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  return (


      <div className='mt-10'>
        <ReferralList />
      </div>

  )
}

export default Referral
