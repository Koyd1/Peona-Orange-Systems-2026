import PromptEditor from "@/components/admin/PromptEditor";

export default function AdminPromptsPage() {
  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-header">
          <div>
            <h1>Prompt Library</h1>
            <p className="section-header-sub">
              Управление шаблонами для быстрого старта диалога в пользовательском чате.
            </p>
          </div>
        </div>
      </div>
      <PromptEditor />
    </>
  );
}
