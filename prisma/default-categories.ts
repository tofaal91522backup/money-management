import type { CategoryType } from "../generated/prisma/client"

type DefaultCategory = {
  name: string
  type: CategoryType
  icon: string
  color: string
}

export const defaultCategories: DefaultCategory[] = [
  { name: "Family support", type: "INCOME", icon: "HeartHandshake", color: "emerald" },
  { name: "Salary", type: "INCOME", icon: "WalletCards", color: "emerald" },
  { name: "Freelancing", type: "INCOME", icon: "Laptop", color: "blue" },
  { name: "Business", type: "INCOME", icon: "BriefcaseBusiness", color: "violet" },
  { name: "Gift", type: "INCOME", icon: "Gift", color: "pink" },
  { name: "Other income", type: "INCOME", icon: "CirclePlus", color: "slate" },
  { name: "Transport", type: "EXPENSE", icon: "BusFront", color: "blue" },
  { name: "Restaurant", type: "EXPENSE", icon: "Utensils", color: "orange" },
  { name: "Groceries", type: "EXPENSE", icon: "ShoppingBasket", color: "lime" },
  { name: "Rent", type: "EXPENSE", icon: "House", color: "violet" },
  { name: "Utilities", type: "EXPENSE", icon: "Zap", color: "amber" },
  { name: "Internet & mobile", type: "EXPENSE", icon: "Wifi", color: "sky" },
  { name: "Healthcare", type: "EXPENSE", icon: "HeartPulse", color: "red" },
  { name: "Education", type: "EXPENSE", icon: "GraduationCap", color: "indigo" },
  { name: "Shopping", type: "EXPENSE", icon: "ShoppingBag", color: "pink" },
  { name: "Entertainment", type: "EXPENSE", icon: "Popcorn", color: "purple" },
  { name: "Subscription", type: "EXPENSE", icon: "Repeat2", color: "cyan" },
  { name: "Family", type: "EXPENSE", icon: "Users", color: "emerald" },
  { name: "Donation", type: "EXPENSE", icon: "HandHeart", color: "rose" },
  { name: "Personal care", type: "EXPENSE", icon: "Sparkles", color: "teal" },
  { name: "Travel", type: "EXPENSE", icon: "Plane", color: "blue" },
  { name: "Emergency", type: "EXPENSE", icon: "Siren", color: "red" },
  { name: "Other expense", type: "EXPENSE", icon: "CircleMinus", color: "slate" },
]
