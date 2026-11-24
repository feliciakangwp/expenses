import {
  Utensils, Car, Home, ShoppingBag, Dumbbell, HeartPulse, Sparkles,
  Laptop, Plane, Clapperboard, BookOpen, Gift, Heart, Shield, Landmark,
  CircleEllipsis, Banknote, TrendingUp, Coffee, Package, Zap, Wifi,
  Smartphone, CreditCard, Wallet, Bus, Train, Building2, GraduationCap,
  Music, Camera, Shirt, Watch, FlaskConical, Stethoscope, Film, Star,
  MapPin, Globe, PiggyBank, BarChart3, type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  home: Home,
  'shopping-bag': ShoppingBag,
  dumbbell: Dumbbell,
  'heart-pulse': HeartPulse,
  sparkles: Sparkles,
  laptop: Laptop,
  plane: Plane,
  clapperboard: Clapperboard,
  'book-open': BookOpen,
  gift: Gift,
  'hand-heart': Heart,
  shield: Shield,
  landmark: Landmark,
  'circle-ellipsis': CircleEllipsis,
  banknote: Banknote,
  'trending-up': TrendingUp,
  coffee: Coffee,
  package: Package,
  zap: Zap,
  wifi: Wifi,
  smartphone: Smartphone,
  'credit-card': CreditCard,
  wallet: Wallet,
  bus: Bus,
  train: Train,
  building: Building2,
  graduation: GraduationCap,
  music: Music,
  camera: Camera,
  shirt: Shirt,
  watch: Watch,
  flask: FlaskConical,
  stethoscope: Stethoscope,
  film: Film,
  star: Star,
  'map-pin': MapPin,
  globe: Globe,
  'piggy-bank': PiggyBank,
  'bar-chart': BarChart3,
  banknotes: Wallet,
}

interface CategoryIconProps {
  icon: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CategoryIcon({ icon, color, size = 'md', className }: CategoryIconProps) {
  const Icon = ICON_MAP[icon] ?? CircleEllipsis

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 26,
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center flex-shrink-0 ${className ?? ''}`}
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon size={iconSizes[size]} style={{ color }} />
    </div>
  )
}
