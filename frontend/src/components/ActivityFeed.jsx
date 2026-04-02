import {
  UserPlus, Calendar, FileText, AlertCircle, CheckCircle, Clock,
  Pill, FlaskConical, Shield, LogIn, LogOut, UserCog, Eye, Pencil, Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'

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
    label: 'Record'
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
  },
  'prescription': {
    icon: Pill,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Prescription'
  },
  'lab-report': {
    icon: FlaskConical,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    label: 'Lab Report'
  },
  'audit': {
    icon: Shield,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    label: 'Audit'
  },
  'audit-login': {
    icon: LogIn,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    label: 'Login'
  },
  'audit-logout': {
    icon: LogOut,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Logout'
  },
  'audit-admin': {
    icon: UserCog,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Admin'
  },
  'audit-view': {
    icon: Eye,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    label: 'Viewed'
  },
  'audit-create': {
    icon: UserPlus,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Created'
  },
  'audit-update': {
    icon: Pencil,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    label: 'Updated'
  },
  'audit-delete': {
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Deleted'
  },
  'lab-request': {
    icon: FlaskConical,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Lab Request'
  },
  'lab-request-new': {
    icon: FlaskConical,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'New Request'
  },
}

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
  const displayActivities = activities.slice(0, maxItems)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Activity Feed
            </CardTitle>
            <CardDescription>Recent activities relevant to you</CardDescription>
          </div>
          {displayActivities.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-medium">Live</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        {displayActivities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No recent activity</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />
            <div className="space-y-6">
              {displayActivities.map((activity, index) => {
                const config = activityConfig[activity.type] || activityConfig['appointment-scheduled']
                const Icon = config.icon

                return (
                  <div
                    key={activity.id}
                    className="relative pl-12 pb-4"
                    style={{
                      animation: `slideInLeft 0.4s ease-out ${index * 0.1}s backwards`
                    }}
                  >
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

                    <div className="
                      bg-white rounded-lg p-4 border border-slate-200
                      hover:border-primary/30 hover:shadow-md
                      transition-all duration-300
                    ">
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

                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {getRelativeTime(activity.timestamp)}
                        </span>
                      </div>

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
        )}
      </CardContent>
    </Card>
  )
}
