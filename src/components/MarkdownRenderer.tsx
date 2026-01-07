import React from 'react';

function parseInline(text: string) {
    // Escape HTML special characters to prevent XSS if we were doing raw HTML,
    // but here we are returning React elements so it's safer.
    // However, since we split by asterisks, we need to be careful.

    // Regex to capture bold (**text**) and italic (*text*)
    // Note: The order matters. Check for ** first.
    // This regex splits the string into parts: [text, bold_content, text, italic_content, text...]
    // We need to match precise pairs.
    
    const parts = text.split(/(\**.*?\**|\*.*?\*|`.*?`)/g);
    
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
            return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
            return <code key={i} className="bg-muted px-1 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
        }
        return part;
    });
}

export function MarkdownRenderer({ content }: { content: string }) {
    if (!content) return null;

    // Normalize newlines
    const normalizedContent = content.replace(/\r\n/g, '\n');
    
    // Split by double newline to identify paragraphs/blocks
    const sections = normalizedContent.split('\n\n');

    return (
        <div className="space-y-4 text-foreground/90 leading-relaxed">
            {sections.map((section, idx) => {
                const trimmed = section.trim();
                
                if (!trimmed) return null;

                // Headers
                if (trimmed.startsWith('# ')) return <h1 key={idx} className="text-3xl font-headline font-bold mt-8 mb-4">{trimmed.replace('# ', '')}</h1>;
                if (trimmed.startsWith('## ')) return <h2 key={idx} className="text-2xl font-headline font-bold mt-8 mb-4">{trimmed.replace('## ', '')}</h2>;
                if (trimmed.startsWith('### ')) return <h3 key={idx} className="text-xl font-headline font-bold mt-6 mb-2">{trimmed.replace('### ', '')}</h3>;

                // Blockquotes
                if (trimmed.startsWith('> ')) {
                     return <blockquote key={idx} className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">{parseInline(trimmed.replace(/^> /, ''))}</blockquote>;
                }

                // Images
                const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
                if (imgMatch) {
                    return (
                        <figure key={idx} className="my-6">
                            <img src={imgMatch[2]} alt={imgMatch[1]} className="rounded-lg shadow-sm w-full object-cover max-h-[500px]" />
                            {imgMatch[1] && <figcaption className="text-center text-xs text-muted-foreground mt-2">{imgMatch[1]}</figcaption>}
                        </figure>
                    );
                }

                // Lists (unordered)
                // Check if the section contains lines starting with "- "
                // If it's a mix, we might need more complex parsing, but for now assuming a block is either a list or text.
                const lines = trimmed.split('\n');
                const isList = lines.every(line => line.trim().startsWith('- ') || line.trim() === '');
                
                if (isList) {
                     return (
                        <ul key={idx} className="list-disc pl-6 space-y-1 my-4">
                            {lines.filter(l => l.trim()).map((line, i) => (
                                <li key={i}>{parseInline(line.trim().substring(2))}</li>
                            ))}
                        </ul>
                    );
                }
                
                // If not a pure list block, but contains list items mixed with text (rare in standard markdown but possible in user input),
                // we'll treat it as lines. If a line starts with "- ", render as list item? No, that breaks the <ul> wrapper.
                // Fallback: If it's just text with some newlines, render with <br/>
                
                return (
                    <p key={idx} className="mb-4">
                        {lines.map((line, i) => (
                            <React.Fragment key={i}>
                                {parseInline(line)}
                                {i < lines.length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </p>
                );
            })}
        </div>
    );
}
