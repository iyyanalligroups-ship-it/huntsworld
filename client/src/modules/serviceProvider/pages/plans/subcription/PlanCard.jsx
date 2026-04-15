import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'

const PlanCard = ({ plan, onSelect }) => {
  const features = plan.elements.reduce((acc, elem) => {
    acc[elem.element_name] = elem.value
    return acc
  }, {})

  return (
    <div className="border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold mb-2">{plan.subscription_plan_id.plan_name}</h3>
      <p className="text-2xl font-bold mb-4">₹{plan?.subscription_plan_id?.plan_code}</p>
      <ul className="mb-4 space-y-2">
        {Object.entries(features).map(([key, value]) => (
          <li key={key} className="flex items-center">
            <span className="text-gray-600">{key}: </span>
            <span className="ml-2">{value}</span>
          </li>
        ))}
      </ul>
      <Button className="w-full" onClick={() => onSelect(plan)}>
        <ShoppingCart className="mr-2 h-4 w-4" /> Buy Now
      </Button>
    </div>
  )
}

export default PlanCard