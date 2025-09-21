"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, Search } from "lucide-react"
import { SAMPLE_COURSES } from "@/lib/match"

interface CourseSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectCourse: (courseId: string) => void
  selectedCourseId?: string
}

export function CourseSelectionModal({ isOpen, onClose, onSelectCourse, selectedCourseId }: CourseSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCourses = SAMPLE_COURSES.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectCourse = (courseId: string) => {
    onSelectCourse(courseId)
    onClose()
  }

  const selectedCourse = SAMPLE_COURSES.find((c) => c.id === selectedCourseId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Course</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Section */}
          <div className="flex gap-2">
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Current Selection */}
          {selectedCourse && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">{selectedCourse.name}</div>
                  <div className="text-sm text-green-700">{selectedCourse.location}</div>
                </div>
              </div>
            </div>
          )}

          {/* Course List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className={`cursor-pointer transition-all ${
                  selectedCourseId === course.id ? "bg-green-50 border-green-300" : "hover:bg-gray-50"
                }`}
                onClick={() => handleSelectCourse(course.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-500">{course.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-4">No courses found matching your search.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
