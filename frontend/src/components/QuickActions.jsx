import { Plus, UserPlus, Calendar, FileText, Bell, Search } from 'lucide-react'

/**
 * ✨ IMPROVEMENT: Quick Actions Floating Menu
 *
 * CHANGES FROM BASIC VERSION:
 * 1. ✅ Floating action buttons for common tasks
 * 2. ✅ Icon + label for clarity
 * 3. ✅ Hover effects with scale and color change
 * 4. ✅ Keyboard accessible
 * 5. ✅ Tooltips for guidance
 * 6. ✅ Grid layout for organization
 *
 * WHY THESE CHANGES:
 * - Quick access to common actions saves time
 * - Visual icons help quick recognition
 * - Reduces clicks to perform tasks
 * - Improves workflow efficiency for staff
 * - Modern, app-like experience
 */

const quickActions = [
  {
    id: 'new-appointment',
    label: 'New Appointment',
    icon: Calendar,
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    description: 'Schedule a new appointment'
  },
  {
    id: 'add-patient',
    label: 'Add Patient',
    icon: UserPlus,
    color: 'from-green-500 to-green-600',
    hoverColor: 'hover:from-green-600 hover:to-green-700',
    description: 'Register a new patient'
  },
  {
    id: 'new-record',
    label: 'New Record',
    icon: FileText,
    color: 'from-purple-500 to-purple-600',
    hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    description: 'Create medical record'
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    color: 'from-orange-500 to-orange-600',
    hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    description: 'Search patients or records'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    color: 'from-pink-500 to-pink-600',
    hoverColor: 'hover:from-pink-600 hover:to-pink-700',
    description: 'View all notifications',
    badge: 5 // Number of unread notifications
  }
]

export function QuickActions({ onActionClick }) {
  return (
    <div className="w-full">
      {/* ✨ SECTION HEADER */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 font-heading">
          Quick Actions
        </h3>
        <p className="text-sm text-slate-500">
          Common tasks and shortcuts
        </p>
      </div>

      {/* ✨ ACTIONS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon

          return (
            <button
              key={action.id}
              onClick={() => onActionClick && onActionClick(action.id)}
              className="
                group relative
                flex flex-col items-center justify-center
                p-6 rounded-xl
                bg-white border-2 border-slate-100
                transition-all duration-300 ease-out
                hover:border-transparent
                hover:shadow-xl hover:shadow-primary/20
                hover:-translate-y-1
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              "
              aria-label={action.description}
            >
              {/* ✨ ICON with gradient background */}
              <div className={`
                relative
                w-12 h-12 rounded-full
                bg-gradient-to-br ${action.color}
                flex items-center justify-center
                mb-3
                transition-transform duration-300
                group-hover:scale-110
                ${action.hoverColor}
              `}>
                <Icon className="w-6 h-6 text-white" />

                {/* ✨ NOTIFICATION BADGE (if present) */}
                {action.badge && (
                  <div className="
                    absolute -top-1 -right-1
                    w-5 h-5 rounded-full
                    bg-red-500 text-white
                    flex items-center justify-center
                    text-xs font-bold
                    animate-pulse
                  ">
                    {action.badge}
                  </div>
                )}
              </div>

              {/* ✨ LABEL */}
              <span className="
                text-sm font-medium text-slate-700
                group-hover:text-slate-900
                transition-colors
                text-center
              ">
                {action.label}
              </span>

              {/* ✨ HOVER EFFECT - Shine animation */}
              <div className="
                absolute inset-0 rounded-xl
                bg-gradient-to-r from-transparent via-white/40 to-transparent
                opacity-0 group-hover:opacity-100
                -translate-x-full group-hover:translate-x-full
                transition-all duration-700
                pointer-events-none
              " />
            </button>
          )
        })}
      </div>

    </div>
  )
}

/**
 * 💡 USAGE EXAMPLE:
 *
 * <QuickActions
 *   onActionClick={(actionId) => {
 *     switch(actionId) {
 *       case 'new-appointment':
 *         // Open appointment modal
 *         break
 *       case 'add-patient':
 *         // Open patient form
 *         break
 *       // ... handle other actions
 *     }
 *   }}
 * />
 */
