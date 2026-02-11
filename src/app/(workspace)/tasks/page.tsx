import { getTasks } from "@/actions/tasks";
import { TasksView } from "@/components/tasks/tasks-view";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const result = await getTasks();
  const tasks = result.success ? result.data ?? [] : [];
  return <TasksView tasks={tasks} />;
}
