import { getCurrentInternalAccessContext } from '@/lib/access/internal-server'
import { canAccessTasksModule } from '@/lib/access/internal-modules'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckSquare, Clock, ListTodo } from 'lucide-react'
import { TaskList } from './components/task-list'
import { AssignTaskButton } from './components/assign-task-form'

export default async function TasksPage() {
    const { supabase, profile, viewer } = await getCurrentInternalAccessContext()

    if (!profile || !viewer) {
        redirect('/auth/login')
    }

    if (profile.role === 'patient') {
        // --- PATIENT VIEW ---
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('patient_id', profile.id)
            .order('due_date', { ascending: true })

        const pendingTasks = tasks?.filter((t: any) => t.status === 'pending' || t.status === 'in_progress') || []
        const completedTasks = tasks?.filter((t: any) => t.status === 'completed' || t.status === 'reviewed') || []

        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <CheckSquare className="h-8 w-8" />
                        Mis Tareas
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Actividades y ejercicios asignados por tu psicólogo
                    </p>
                </div>

                <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full max-w-full grid-cols-2 sm:max-w-md">
                        <TabsTrigger value="pending">Pendientes ({pendingTasks.length})</TabsTrigger>
                        <TabsTrigger value="completed">Completadas ({completedTasks.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="mt-6">
                        {pendingTasks.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <TaskList tasks={pendingTasks} type="pending" />
                            </div>
                        ) : (
                            <Card className="bg-muted/50 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                    <CheckSquare className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium">No tienes tareas pendientes</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                        ¡Excelente trabajo! Has completado todas tus actividades asignadas.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="completed" className="mt-6">
                        {completedTasks.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <TaskList tasks={completedTasks} type="completed" />
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                Aún no has completado ninguna tarea.
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        )
    }

    if (!canAccessTasksModule(viewer)) {
        if (profile.role === 'psychologist') {
            redirect('/dashboard/subscription')
        }

        redirect('/dashboard')
    }

    // Get assigned patients for the dropdown
    const { data: relationships } = await ((supabase
        .from('patient_psychologist_relationships') as any) as any)
        .select('patient_id')
        .eq('psychologist_id', profile.id)
        .eq('status', 'active')

    const patientIds = (relationships || []).map((r: any) => r.patient_id)

    // Fetch patient names
    let patients: { id: string; full_name: string }[] = []
    if (patientIds.length > 0) {
        const { data: patientProfiles } = await ((supabase
            .from('profiles') as any) as any)
            .select('id, full_name')
            .in('id', patientIds)

        patients = (patientProfiles || []).map((p: any) => ({
            id: p.id,
            full_name: p.full_name || 'Sin nombre'
        }))
    }

    // Build patient name lookup
    const patientMap: Record<string, string> = {}
    patients.forEach(p => { patientMap[p.id] = p.full_name })

    // Get all tasks assigned by this psychologist
    const { data: tasks } = await ((supabase
        .from('tasks') as any) as any)
        .select('*')
        .eq('psychologist_id', profile.id)
        .order('created_at', { ascending: false })

    const pendingTasks = tasks?.filter((t: any) => t.status === 'pending' || t.status === 'in_progress') || []
    const completedTasks = tasks?.filter((t: any) => t.status === 'completed' || t.status === 'reviewed') || []

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <ListTodo className="h-8 w-8" />
                        Tareas Asignadas
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona las tareas y actividades de tus pacientes
                    </p>
                </div>
                <AssignTaskButton patients={patients} />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingTasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                        <CheckSquare className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pacientes con tareas</CardTitle>
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Set(tasks?.map((t: any) => t.patient_id) || []).size}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full max-w-full grid-cols-2 sm:max-w-md">
                    <TabsTrigger value="pending">Pendientes ({pendingTasks.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completadas ({completedTasks.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    {pendingTasks.length > 0 ? (
                        <div className="space-y-3">
                            {pendingTasks.map((task: any) => (
                                <Card key={task.id} className="hover:bg-muted/50 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">{task.title}</h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.type === 'journal' ? 'bg-brand-yellow text-brand-yellow' :
                                                        task.type === 'exercise' ? 'surface-alert-success' :
                                                            task.type === 'reading' ? 'bg-brand-brown text-brand-brown' :
                                                                task.type === 'form' ? 'bg-orange-100 text-orange-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {task.type === 'journal' ? 'Diario' :
                                                            task.type === 'exercise' ? 'Ejercicio' :
                                                                task.type === 'reading' ? 'Lectura' :
                                                                    task.type === 'form' ? 'Formulario' : 'General'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Paciente: {patientMap[task.patient_id] || 'Sin nombre'}
                                                </p>
                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right text-sm text-muted-foreground">
                                                {task.due_date && (
                                                    <p>Vence: {new Date(task.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                                                )}
                                                <p className="text-xs mt-1">
                                                    {task.status === 'pending' ? '⏳ Pendiente' : '🔄 En progreso'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="bg-muted/50 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                <CheckSquare className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-lg font-medium">No hay tareas pendientes</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                    Usa el botón "Asignar Tarea" para enviar actividades a tus pacientes.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="completed" className="mt-6">
                    {completedTasks.length > 0 ? (
                        <div className="space-y-3">
                            {completedTasks.map((task: any) => (
                                <Card key={task.id} className="opacity-80">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <h3 className="font-medium line-through">{task.title}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Paciente: {patientMap[task.patient_id] || 'Sin nombre'}
                                                </p>
                                                {task.completion_notes && (
                                                    <p className="text-sm mt-1 bg-green-50 p-2 rounded text-green-800">
                                                        Respuesta: {task.completion_notes}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-xs px-2 py-1 rounded-full surface-alert-success">
                                                ✓ Completada
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            Aún no se han completado tareas.
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

