import { notFound } from "next/navigation";
import { getTask } from "@/actions/tasks";
import { TaskDetail } from "@/components/tasks/task-detail";

export async function generateMetadata({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const result = await getTask(taskId);
  return { title: result.success ? result.data?.title : "Task" };
}

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const result = await getTask(taskId);
  if (!result.success || !result.data) notFound();
  return <TaskDetail task={result.data} />;
}
