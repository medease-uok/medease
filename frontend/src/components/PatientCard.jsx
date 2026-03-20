import { User, Calendar, Droplet, Phone, Clock, FileText } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'

export function PatientCard({ patient, onClick }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getDaysSinceVisit = (date) => {
    if (!date) return null
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const formatUpcoming = (date) => {
    if (!date) return null
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  return (
    <Card
      onClick={() => onClick && onClick(patient)}
      className="
        group cursor-pointer
        transition-all duration-300 ease-out
        hover:shadow-lg hover:shadow-primary/10
        hover:border-primary/50
        hover:-translate-y-1
      "
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            {patient.avatarUrl ? (
              <img
                src={patient.avatarUrl}
                alt={patient.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="
                w-16 h-16 rounded-full
                bg-gradient-to-br from-primary to-primary/60
                flex items-center justify-center
                text-white font-semibold text-lg
                ring-2 ring-primary/20
              ">
                {getInitials(patient.name)}
              </div>
            )}

            {patient.status === 'active' && (
              <div className="
                absolute bottom-0 right-0
                w-4 h-4 bg-green-500 rounded-full
                border-2 border-white
                animate-pulse
              " />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary transition-colors">
                  {patient.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {patient.id}
                </p>
              </div>

              <Badge
                variant={patient.status === 'active' ? 'success' : 'secondary'}
                className="text-xs"
              >
                {patient.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {patient.bloodType && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-red-50">
                    <Droplet className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Blood Type</p>
                    <p className="font-medium text-slate-900">{patient.bloodType}</p>
                  </div>
                </div>
              )}

              {patient.age && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-blue-50">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Age</p>
                    <p className="font-medium text-slate-900">{patient.age} years</p>
                  </div>
                </div>
              )}

              {patient.phone && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-green-50">
                    <Phone className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-medium text-slate-900 text-xs truncate">
                      {patient.phone}
                    </p>
                  </div>
                </div>
              )}

              {patient.lastVisit && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-purple-50">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Last Visit</p>
                    <p className="font-medium text-slate-900 text-xs">
                      {getDaysSinceVisit(patient.lastVisit)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Doctor-specific summary stats */}
            {(patient.nextAppointment || patient.totalAppointments > 0) && (
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                {patient.nextAppointment && (
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <Clock className="w-3 h-3" />
                    Next: {formatUpcoming(patient.nextAppointment)}
                  </span>
                )}
                {patient.totalAppointments > 0 && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {patient.totalAppointments} visits
                  </span>
                )}
                {patient.totalRecords > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {patient.totalRecords} records
                  </span>
                )}
              </div>
            )}

            {patient.conditions && patient.conditions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {patient.conditions.map((condition, idx) => (
                  <span
                    key={idx}
                    className="
                      text-xs px-2 py-1 rounded-full
                      bg-orange-50 text-orange-700
                      border border-orange-200
                    "
                  >
                    {condition}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="
          mt-4 pt-3 border-t border-slate-100
          flex items-center justify-between
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        ">
          <span className="text-xs text-slate-500">Click to view full details</span>
          <div className="text-primary">→</div>
        </div>
      </CardContent>
    </Card>
  )
}
