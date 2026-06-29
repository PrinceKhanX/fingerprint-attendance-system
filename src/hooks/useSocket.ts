import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface AttendanceEvent {
  studentId: string
  studentName: string
  studentEmail: string
  student_id: string
  status: string
  marked_by: string
  timestamp: string
  classId: string
  className: string
}

export function useSocket(classId: string | null, onAttendanceMarked: (event: AttendanceEvent) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const callbackRef = useRef(onAttendanceMarked)

  // Update callback ref without triggering socket reconnection
  useEffect(() => {
    callbackRef.current = onAttendanceMarked
  }, [onAttendanceMarked])

  useEffect(() => {
    if (!classId) return

    // Initialize socket connection only if not already connected for this class
    if (socketRef.current?.connected) {
      // If already connected, just join the new class
      socketRef.current.emit('leave-class', classId)
      socketRef.current.emit('join-class', classId)
      return
    }

    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      setIsConnected(true)
      // Join the class room
      socket.emit('join-class', classId)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    // Listen for attendance events using ref to avoid reconnection
    socket.on('attendance-marked', (event: AttendanceEvent) => {
      console.log('Attendance marked event received:', event)
      callbackRef.current(event)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-class', classId)
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [classId]) // Only depend on classId, not onAttendanceMarked

  return { isConnected }
}
