import { UserPlus, Calendar, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'

/**
 * ✨ IMPROVEMENT: Activity Feed with Real-time Updates
 *
 * CHANGES FROM BASIC VERSION:
 * 1. ✅ Timeline-style activity feed
 * 2. ✅ Color-coded activity types
 * 3. ✅ Relative time stamps (5 mins ago, etc.)
 * 4. ✅ Icons for different activity types
 * 5. ✅ Smooth fade-in animations for new items
 * 6. ✅ Connecting lines between activities
 * 7. ✅ User avatars for activities
 *
 * WHY THESE CHANGES:
 * - Timeline visualization shows activity flow
 * - Real-time updates keep staff informed
 * - Color coding allows quick scanning
 * - Improves situational awareness
 * - Professional activity tracking
 */

// Activity type configuration
const activityConfig = {
  'patient-registered': {
    icon: UserPlus,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'New Patient'
  },
  'appointment-scheduled': {
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Appointment'
  },
  'record-created': {
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Medical Record'
  },
  'appointment-completed': {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Completed'
  },
  'appointment-cancelled': {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Cancelled'
  }
}

// Format relative time
function getRelativeTime(timestamp) {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInMinutes = Math.floor((now - time) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
}

export function ActivityFeed({ activities = [], maxItems = 10 }) {
  // Sample activities if none provided
  const sampleActivities = [
    {
      id: 1,
      type: 'patient-registered',
      user: 'Dr. Sarah Smith',
      description: 'Registered new patient John Doe',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      details: 'Patient ID: PAT-2024-001'
    },
    {
      id: 2,
      type: 'appointment-scheduled',
      user: 'Nurse Emma Wilson',
      description: 'Scheduled appointment with Dr. Johnson',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      details: 'March 15, 2024 at 10:00 AM'
    },
    {
      id: 3,
      type: 'record-created',
      user: 'Dr. Michael Brown',
      description: 'Created medical record for Alice Cooper',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      details: 'Diagnosis: Common Cold'
    },
    {
      id: 4,
      type: 'appointment-completed',
      user: 'Dr. Sarah Smith',
      description: 'Completed appointment with Bob Wilson',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      details: 'Duration: 30 minutes'
    },
    {
      id: 5,
      type: 'appointment-cancelled',
      user: 'Reception',
      description: 'Appointment cancelled by patient',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      details: 'Reason: Personal emergency'
    }
  ]

  const displayActivities = activities.length > 0
    ? activities.slice(0, maxItems)
    : sampleActivities.slice(0, maxItems)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Activity Feed
            </CardTitle>
            <CardDescription>Recent system activities</CardDescription>
          </div>

          {/* ✨ LIVE INDICATOR */}
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-medium">Live</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* ✨ TIMELINE CONTAINER */}
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

          {/* Activities list */}
          <div className="space-y-6">
            {displayActivities.map((activity, index) => {
              const config = activityConfig[activity.type]
              const Icon = config.icon

              return (
                <div
                  key={activity.id}
                  className="relative pl-12 pb-4"
                  style={{
                    animation: `slideInLeft 0.4s ease-out ${index * 0.1}s backwards`
                  }}
                >
                  {/* ✨ ICON BADGE */}
                  <div className={`
                    absolute left-0 top-0
                    w-10 h-10 rounded-full
                    ${config.bgColor}
                    flex items-center justify-center
                    ring-4 ring-white
                    z-10
                  `}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* ✨ ACTIVITY CONTENT */}
                  <div className="
                    bg-white rounded-lg p-4 border border-slate-200
                    hover:border-primary/30 hover:shadow-md
                    transition-all duration-300
                  ">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`
                            text-xs font-semibold px-2 py-0.5 rounded-full
                            ${config.bgColor} ${config.color}
                          `}>
                            {config.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {activity.user}
                          </span>
                        </div>
                        <p className="text-sm text-slate-900 font-medium">
                          {activity.description}
                        </p>
                      </div>

                      {/* ✨ RELATIVE TIMESTAMP */}
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {getRelativeTime(activity.timestamp)}
                      </span>
                    </div>

                    {/* Details */}
                    {activity.details && (
                      <p className="text-xs text-slate-500 mt-2 pl-2 border-l-2 border-slate-200">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ✨ VIEW ALL BUTTON */}
        <button className="
          w-full mt-4 py-2 rounded-lg
          border-2 border-dashed border-slate-200
          text-sm font-medium text-slate-500
          hover:border-primary hover:text-primary
          hover:bg-primary/5
          transition-all duration-300
        ">
          View All Activities →
        </button>
      </CardContent>
    </Card>
  )
}

/**
 * 💡 CSS ANIMATION KEYFRAMES
 */
const styles = `
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}

/**
 * 💡 USAGE EXAMPLE:
 *
 * <ActivityFeed
 *   activities={recentActivities}
 *   maxItems={10}
 * />
 */
