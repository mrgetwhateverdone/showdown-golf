"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Check, ArrowLeft, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import { SAMPLE_COURSES } from "@/lib/match"

interface HomeCourseModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HomeCourseModal({ isOpen, onClose }: HomeCourseModalProps) {
  const { user, updateUser } = useAuth()
  const [selectedCourse, setSelectedCourse] = useState(user?.homeCourse || "")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCourses = SAMPLE_COURSES.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSave = () => {
    updateUser({ homeCourse: selectedCourse })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 bg-gray-50">
        {/* Header */}
        <div className="bg-teal-700 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-teal-600 border-teal-500 text-white placeholder-teal-200 rounded-full"
              />
            </div>
            <div className="text-white font-semibold">${user?.balance || 0}</div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onClose}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Change Home Course</h1>
          </div>

          {/* Current Home Course */}
          {user?.homeCourse && (
            <div className="mb-6">
              <Card className="bg-teal-50 border-teal-200 rounded-3xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Current Home Course</h3>
                      <p className="text-gray-600">{user.homeCourse}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Course List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className={`cursor-pointer transition-all rounded-3xl ${
                  selectedCourse === course.name ? "bg-teal-50 border-teal-300 shadow-md" : "bg-white hover:bg-gray-50"
                }`}
                onClick={() => setSelectedCourse(course.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{course.name}</h3>
                        <p className="text-sm text-gray-500">Kansas City Metro Area</p>
                      </div>
                    </div>
                    {selectedCourse === course.name && <Check className="w-6 h-6 text-teal-600" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 pt-6 mt-6 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent rounded-full">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-teal-700 hover:bg-teal-800 rounded-full">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
