const dedicatedTools = new Set([
  'Identity Intelligence',
  'Login History',
  'Payment Verification',
  'Business Intelligence',
]);

export default function DedicatedToolSwitcher({ activeCategory, tool, openTool }) {
  if (!dedicatedTools.has(tool)) return null;
  return (
    <label className="dedicated-tool-switcher">
      <span>Current tool</span>
      <select value={tool} onChange={(event) => openTool(event.target.value)} aria-label="Choose investigation tool">
        {activeCategory.tools.map((item) => <option key={item}>{item}</option>)}
      </select>
    </label>
  );
}
