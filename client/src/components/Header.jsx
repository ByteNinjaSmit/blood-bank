export function PageHeader({
  icon: Icon,
  title,
  description,
  iconBgColor = "bg-blue-800",
  rightSection // <-- Accepts custom buttons or actions
}) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Icon + Title + Description */}
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2.5 ${iconBgColor} rounded-lg flex-shrink-0 mt-0.5`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
              {description && (
                <p className="text-gray-500 text-sm mt-0.5">{description}</p>
              )}
            </div>
          </div>

          {/* Right: Custom Button Section */}
          {rightSection && <div className="flex gap-2">{rightSection}</div>}
        </div>
      </div>
    </div>
  )
}
