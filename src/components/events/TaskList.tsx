import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, ListChecks } from "lucide-react";
import { useAppStore } from "@/store/appStore";

interface TaskListProps {
  eventId: string;
}

const TaskList = ({ eventId }: TaskListProps) => {
  const tasks = useAppStore(s => s.getTasksByEvent(eventId));
  const createTask = useAppStore(s => s.createTask);
  const updateTask = useAppStore(s => s.updateTask);
  const deleteTask = useAppStore(s => s.deleteTask);
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      createTask({
        eventId,
        title: newTaskTitle.trim(),
      });
      setNewTaskTitle("");
      setDialogOpen(false);
    }
  };

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-brand-accent" aria-hidden="true" />
              Task List
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setDialogOpen(true)}
              aria-label="Aggiungi nuovo task"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Task list */}
          <div className="max-h-[120px] overflow-y-auto pr-2">
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nessun task aggiunto.</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 p-2 border rounded-md bg-background"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => handleToggleComplete(task.id, !!checked)}
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aggiunto il {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Aggiungi nuovo task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Titolo del task</Label>
              <Input
                id="taskTitle"
                placeholder="Inserisci il titolo del task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleCreateTask}>
                Aggiungi task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskList;