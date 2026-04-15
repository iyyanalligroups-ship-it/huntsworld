'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import MerchantProductForm from './MerchantProductForm'
import MerchantProductList from './MerchantProductList'

const ProductListing = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="w-full lg:p-4 space-y-4">
      {/* Product List Section */}
      <MerchantProductList />
    </div>
  )
}

export default ProductListing