import PromptEditor from "@/components/admin/PromptEditor";

export default function AdminPromptsPage() {
  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <h1 style={{ marginTop: 0 }}>Prompt Library</h1>
        <p style={{ marginTop: 0 }}>
          Управление шаблонами для быстрого старта диалога в пользовательском чате.
        </p>
      </div>
      <PromptEditor />
    </>
  );
}
