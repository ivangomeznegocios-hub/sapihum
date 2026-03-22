'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Calendar, CheckSquare, Clock, BookOpen, Activity, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react'
import { completeTask } from '../actions'

interface Task {
    id: string
    title: string
    description: string | null
    type: 'journal' | 'reading' | 'exercise' | 'form' | 'general'
    status: 'pending' | 'in_progress' | 'completed' | 'reviewed'
    due_date: string | null
    content: any
    response: any
    completion_notes: string | null
    created_at: string
    updated_at: string
}

interface TaskListProps {
    tasks: Task[]
    type: 'pending' | 'completed'
}

export function TaskList({ tasks, type }: TaskListProps) {
    if (tasks.length === 0) return null

    return (
        <>
            {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
            ))}
        </>
    )
}

function TaskCard({ task }: { task: Task }) {
    const [open, setOpen] = useState(false)
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleComplete() {
        if (!notes.trim() && task.type === 'journal') {
            alert('Por favor escribe una nota para completar esta tarea.')
            return
        }

        setIsSubmitting(true)
        const result = await completeTask(task.id, {}, notes)
        setIsSubmitting(false)

        if (result.error) {
            alert(result.error)
        } else {
            setOpen(false)
        }
    }

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status === 'pending'

    const getIcon = (type: string) => {
        switch (type) {
            case 'journal': return <BookOpen className="h-5 w-5 text-blue-500" />
            case 'exercise': return <Activity className="h-5 w-5 text-green-500" />
            case 'reading': return <FileText className="h-5 w-5 text-purple-500" />
            default: return <CheckSquare className="h-5 w-5 text-slate-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'surface-alert-success border-green-200'
            case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            default: return 'bg-slate-100 text-slate-800'
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Card className={`cursor-pointer hover:shadow-md transition-all ${isOverdue ? 'border-red-200 bg-red-50/10' : ''}`}>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-muted rounded-lg w-fit">
                                {getIcon(task.type)}
                            </div>
                            {isOverdue && (
                                <Badge variant="destructive" className="flex gap-1 items-center font-normal px-2">
                                    <AlertCircle className="h-3 w-3" /> Vencida
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{task.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                            {task.description || 'Sin descripción'}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {task.due_date ? format(new Date(task.due_date), 'dd MMM yyyy', { locale: es }) : 'Sin fecha'}
                        </div>
                        <div className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-medium ${getStatusColor(task.status)}`}>
                            {task.status === 'pending' ? 'Pendiente' :
                                task.status === 'completed' ? 'Completada' :
                                    task.status === 'reviewed' ? 'Revisada' : task.status}
                        </div>
                    </CardFooter>
                </Card>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {getIcon(task.type)}
                        {task.title}
                    </DialogTitle>
                    <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">{task.type}</Badge>
                        {task.status === 'completed' && <Badge className="bg-green-500 hover:bg-green-600">Completada</Badge>}
                    </div>
                    {task.due_date && (
                        <DialogDescription className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            Vence el {format(new Date(task.due_date), 'PPP', { locale: es })}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="text-sm bg-muted p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Instrucciones:</h4>
                        <p className="whitespace-pre-wrap">{task.description}</p>

                        {task.content?.link && (
                            <a
                                href={task.content.link}
                                target="_blank"
                                className="flex items-center gap-2 text-blue-600 hover:underline mt-4"
                            >
                                <LinkIcon className="h-4 w-4" />
                                {task.content.link_text || 'Ver recurso adjunto'}
                            </a>
                        )}
                    </div>

                    {task.status === 'pending' || task.status === 'in_progress' ? (
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Tu respuesta / Notas:</label>
                            <textarea
                                className="w-full min-h-[100px] p-3 rounded-md border text-sm"
                                placeholder="Escribe aquí tu respuesta, reflexiones o comentarios sobre la tarea..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-100 p-4 rounded-lg space-y-2">
                            <h4 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                                <CheckSquare className="h-4 w-4" />
                                Tu respuesta
                            </h4>
                            <p className="text-sm text-green-900 whitespace-pre-wrap">
                                {task.completion_notes || 'Sin notas.'}
                            </p>
                            <p className="text-xs text-green-700 mt-2">
                                Completada el {task.updated_at && format(new Date(task.updated_at), 'PPP p', { locale: es })}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {task.status === 'pending' || task.status === 'in_progress' ? (
                        <Button onClick={handleComplete} disabled={isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <CheckSquare className="mr-2 h-4 w-4" />
                                    Marcar como Completada
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cerrar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

