import { User, Calendar, Droplet, Phone, Mail } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'

/**
 * ✨ IMPROVEMENT: Patient Card with Avatar & Rich Details
 *
 * CHANGES FROM BASIC VERSION:
 * 1. ✅ Avatar with fallback initials
 * 2. ✅ Rich patient information (ID, blood type, age, phone)
 * 3. ✅ Status badge (Active/Inactive)
 * 4. ✅ Last visit indicator
 * 5. ✅ Hover effect with border highlight
 * 6. ✅ Clickable with cursor pointer
 * 7. ✅ Icons for better visual scanning
 *
 * WHY THESE CHANGES:
 * - Avatar makes it more personal and professional
 * - Icons improve visual hierarchy and scanning
 * - Status badge provides quick status check
 * - Hover effect shows interactivity
 * - Complete info reduces need to click for details
 */

export function PatientCard({ patient, onClick }) {
  // Generate initials from name for avatar fallback
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Calculate days since last visit
  const getDaysSinceVisit = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
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
          {/* ✨ AVATAR with gradient background and initials */}
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

            {/* ✨ STATUS INDICATOR (green dot for active) */}
            {patient.status === 'active' && (
              <div className="
                absolute bottom-0 right-0
                w-4 h-4 bg-green-500 rounded-full
                border-2 border-white
                animate-pulse
              " />
            )}
          </div>

          {/* ✨ PATIENT INFO */}
          <div className="flex-1 min-w-0">
            {/* Name & Status Badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary transition-colors">
                  {patient.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {patient.id}
                </p>
              </div>

              {/* ✨ STATUS BADGE */}
              <Badge
                variant={patient.status === 'active' ? 'success' : 'secondary'}
                className="text-xs"
              >
                {patient.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* ✨ PATIENT DETAILS GRID */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* Blood Type */}
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

              {/* Age */}
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

              {/* Phone */}
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

              {/* Last Visit */}
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

            {/* ✨ MEDICAL CONDITIONS (if any) */}
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

        {/* ✨ HOVER INDICATOR */}
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

/**
 * 💡 USAGE EXAMPLE:
 *
 * <PatientCard
 *   patient={{
 *     id: 'PAT-001',
 *     name: 'John Doe',
 *     bloodType: 'O+',
 *     age: 45,
 *     phone: '+1 234 567 8900',
 *     status: 'active',
 *     lastVisit: '2024-03-01',
 *     conditions: ['Diabetes', 'Hypertension']
 *   }}
 *   onClick={(patient) => console.log('Clicked:', patient)}
 * />
 */
