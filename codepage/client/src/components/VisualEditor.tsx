import { useState, useRef, useEffect } from 'react';

interface Props {
  code: string;
  format: string;
  onChange: (newCode: string) => void;
}

export function VisualEditor({ code, format, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<'structure' | 'style' | 'script'>('structure');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!code) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#555', fontSize: 13,
      }}>
        Generate code first, then edit visually here
      </div>
    );
  }

  if (format !== 'html') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#555', fontSize: 13, flexDirection: 'column', gap: 8,
      }}>
        <span>⚠ Visual editor supports HTML only</span>
        <span style={{ fontSize: 11, color: '#777' }}>Switch to Source tab to edit {format.toUpperCase()} code</span>
      </div>
    );
  }

  const sections = extractSections(code);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #2a2a35' }}>
        {(['structure', 'style', 'script'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '6px 0', border: 'none',
              background: activeTab === tab ? '#1a1a22' : 'transparent',
              color: activeTab === tab ? '#e1e1e6' : '#666',
              fontSize: 11, cursor: 'pointer', fontWeight: activeTab === tab ? 600 : 400,
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
              textTransform: 'capitalize',
            }}
          >{tab}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <textarea
          ref={textareaRef}
          value={sections[activeTab] || ''}
          onChange={(e) => {
            const newSections = { ...sections, [activeTab]: e.target.value };
            const rebuilt = rebuildHTML(newSections);
            onChange(rebuilt);
          }}
          style={{
            width: '100%', height: '100%', border: 'none', outline: 'none',
            resize: 'none', background: '#0d0d14', color: '#e1e1e6',
            padding: 12, fontSize: 13, fontFamily: "'JetBrains Mono','Fira Code',monospace",
            lineHeight: 1.5,
          }}
        />
      </div>
      <div style={{
        padding: '4px 12px', borderTop: '1px solid #2a2a35',
        fontSize: 10, color: '#555', display: 'flex', gap: 12,
      }}>
        <span>💡 Edit each section independently</span>
        <span>HTML: {sections.structure.length} chars</span>
        <span>CSS: {sections.style.length} chars</span>
        <span>JS: {sections.script.length} chars</span>
      </div>
    </div>
  );
}

function extractSections(html: string): Record<string, string> {
  const styleParts: string[] = [];
  const scriptParts: string[] = [];

  html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, content) => {
    styleParts.push(content.trim());
    return '';
  });
  html = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (_, content) => {
    scriptParts.push(content.trim());
    return '';
  });

  return { structure: html.trim(), style: styleParts.join('\n'), script: scriptParts.join('\n') };
}

function rebuildHTML(sections: Record<string, string>): string {
  let html = sections.structure;

  if (sections.style) {
    const styleTag = `\n<style>\n${sections.style}\n</style>\n`;
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, styleTag + '</head>');
    } else {
      html = styleTag + '\n' + html;
    }
  }

  if (sections.script) {
    const scriptTag = `\n<script>\n${sections.script}\n</script>\n`;
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, scriptTag + '</body>');
    } else {
      html += '\n' + scriptTag;
    }
  }

  return html;
}
