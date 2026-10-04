"use client";

import type { ProposalSection } from "@/lib/types";

type Props = {
  sections: ProposalSection[];
  onChange: (sections: ProposalSection[]) => void;
};

export default function ProposalSectionsForm({ sections, onChange }: Props) {
  function updateSection(index: number, patch: Partial<ProposalSection>) {
    const next = sections.map((section, i) => (i === index ? { ...section, ...patch } : section));
    onChange(next);
  }

  function addSection() {
    onChange([...sections, { heading: "", body: "" }]);
  }

  function removeSection(index: number) {
    if (sections.length <= 1) return; // 最低1セクションは残す
    onChange(sections.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={index} className="border border-gray-100 rounded-md p-4 space-y-2">
          <div className="flex items-center gap-2">
            <input
              className="input flex-1"
              placeholder="見出し"
              required
              value={section.heading}
              onChange={(e) => updateSection(index, { heading: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeSection(index)}
              disabled={sections.length <= 1}
              className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-sm"
              aria-label="このセクションを削除"
            >
              ✕
            </button>
          </div>
          <textarea
            className="input"
            rows={4}
            placeholder="本文"
            value={section.body}
            onChange={(e) => updateSection(index, { body: e.target.value })}
          />
        </div>
      ))}

      <button type="button" onClick={addSection} className="btn-secondary mt-1 text-sm">
        + セクションを追加
      </button>
    </div>
  );
}
