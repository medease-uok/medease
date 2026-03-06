import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function AnimatedStatsCard({ stat, index = 0 }) {
  const Icon = stat.icon
  const isPositive = stat.trend === 'up'

  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = stat.value
    const duration = 1000
    const increment = end / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [stat.value])

  return (
    <Card
      className="
        relative overflow-hidden
        transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-xl hover:shadow-primary/20
        cursor-pointer
        group
      "
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`
      }}
    >
      <div className="
        absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
      " />

      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
        <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-primary transition-colors">
          {stat.label}
        </CardTitle>

        <div className="
          p-2 rounded-lg bg-primary/10
          group-hover:bg-primary/20
          group-hover:rotate-12
          transition-all duration-300
        ">
          <Icon
            className="w-4 h-4 text-primary"
            aria-hidden="true"
          />
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="text-3xl font-bold font-heading text-slate-900 mb-2">
          {displayValue.toLocaleString()}
        </div>

        <div className="flex items-center gap-2">
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
            ${isPositive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }
          `}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" aria-label="Trending up" />
            ) : (
              <TrendingDown className="w-3 h-3" aria-label="Trending down" />
            )}
            <span>{Math.abs(stat.change).toFixed(1)}%</span>
          </div>
          <span className="text-xs text-slate-500">vs last month</span>
        </div>

        <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              isPositive ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{
              width: `${Math.min(Math.abs(stat.change) * 2, 100)}%`,
              transitionDelay: `${index * 0.1}s`
            }}
          />
        </div>
      </CardContent>

      <div className="
        absolute top-0 -left-full w-1/2 h-full
        bg-gradient-to-r from-transparent via-white/20 to-transparent
        group-hover:left-full transition-all duration-700 ease-out
        pointer-events-none
      " />
    </Card>
  )
}

const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
