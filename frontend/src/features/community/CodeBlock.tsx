import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useToast } from './ToastProvider';

interface CodeBlockProps {
  code: string;
  language: string | null;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast('Could not copy code to the clipboard.', 'error');
    }
  }

  return (
    <div className="workspace-code">
      <div className="workspace-code-bar">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em]">
          {language ?? 'code'}
        </span>
        <button
          type="button"
          className="workspace-icon-button h-8 gap-1.5 px-2 text-[11px]"
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <pre className="workspace-code-body">
        <code>{code}</code>
      </pre>
    </div>
  );
}
