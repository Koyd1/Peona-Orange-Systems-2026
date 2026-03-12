import PromptEditor from "@/components/admin/PromptEditor";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminPromptsPage() {
  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <div>
            <CardTitle className="text-2xl">Prompt Library</CardTitle>
            <CardDescription>
              Управление шаблонами для быстрого старта диалога в пользовательском чате.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
      <PromptEditor />
    </>
  );
}
