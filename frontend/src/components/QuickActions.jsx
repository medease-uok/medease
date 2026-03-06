import { UserPlus, Calendar, FileText, Bell, Search, Pill, FlaskConical, Stethoscope, Users } from 'lucide-react'

const allActions = [
  {
    id: 'new-appointment',
    label: 'Appointments',
    icon: Calendar,
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    description: 'View appointments',
    path: '/appointments',
    roles: ['patient', 'doctor', 'nurse', 'admin'],
  },
  {
    id: 'patients',
    label: 'Patients',
    icon: Users,
    color: 'from-green-500 to-green-600',
    hoverColor: 'hover:from-green-600 hover:to-green-700',
    description: 'View patients',
    path: '/patients',
    roles: ['doctor', 'nurse', 'admin'],
  },
  {
    id: 'doctors',
    label: 'Doctors',
    icon: Stethoscope,
    color: 'from-teal-500 to-teal-600',
    hoverColor: 'hover:from-teal-600 hover:to-teal-700',
    description: 'View doctors',
    path: '/doctors',
    roles: ['patient', 'admin'],
  },
  {
    id: 'medical-records',
    label: 'Records',
    icon: FileText,
    color: 'from-purple-500 to-purple-600',
    hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    description: 'Medical records',
    path: '/medical-records',
    roles: ['patient', 'doctor', 'nurse', 'admin'],
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions',
    icon: Pill,
    color: 'from-orange-500 to-orange-600',
    hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    description: 'View prescriptions',
    path: '/prescriptions',
    roles: ['patient', 'doctor', 'pharmacist', 'admin'],
  },
  {
    id: 'lab-reports',
    label: 'Lab Reports',
    icon: FlaskConical,
    color: 'from-pink-500 to-pink-600',
    hoverColor: 'hover:from-pink-600 hover:to-pink-700',
    description: 'View lab reports',
    path: '/lab-reports',
    roles: ['patient', 'doctor', 'lab_technician', 'admin'],
  },
]

export function QuickActions({ onActionClick, role }) {
  const actions = role
    ? allActions.filter((a) => a.roles.includes(role))
    : allActions;

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 font-heading">
          Quick Actions
        </h3>
        <p className="text-sm text-slate-500">
          Common tasks and shortcuts
        </p>
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-3 ${actions.length > 4 ? 'lg:grid-cols-6' : `lg:grid-cols-${actions.length}`} gap-4`}>
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <button
              key={action.id}
              onClick={() => onActionClick && onActionClick(action.id, action.path)}
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
              </div>

              <span className="
                text-sm font-medium text-slate-700
                group-hover:text-slate-900
                transition-colors
                text-center
              ">
                {action.label}
              </span>

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
