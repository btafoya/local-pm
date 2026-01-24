'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Plus,
} from 'lucide-react'

const navItems = [
  { href: '/board', label: 'Board', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/teams', label: 'Teams', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-[#0f0f0f] border-r border-[#27272a] flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-[#27272a]">
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-xs font-bold">
            P
          </span>
          Local PM
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-[#27272a] text-white'
                      : 'text-gray-400 hover:bg-[#1f1f23] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Quick Actions */}
      <div className="p-2 border-t border-[#27272a]">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-[#1f1f23] hover:text-white rounded-md transition-colors">
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[#27272a]">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-[#1f1f23] hover:text-white rounded-md transition-colors"
        >
          <Settings className="w-4 h-4" />
          Admin Panel
        </Link>
      </div>
    </aside>
  )
}
