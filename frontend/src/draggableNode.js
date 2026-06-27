// draggableNode.js — one node chip in the palette bar (icon tile + label).

import { categoryTint, categoryIcon } from './nodes/nodeTheme';

export const DraggableNode = ({ type, label, category = 'data' }) => {
  const onDragStart = (event, nodeType) => {
    const appData = { nodeType };
    event.target.style.cursor = 'grabbing';
    event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="vs-chip"
      onDragStart={(event) => onDragStart(event, type)}
      onDragEnd={(event) => (event.target.style.cursor = 'grab')}
      draggable
      title={label}
    >
      <span className="vs-chip__icon" style={{ background: categoryTint(category) }} aria-hidden="true">
        {categoryIcon(category, { size: 13 })}
      </span>
      <span className="vs-chip__name">{label}</span>
    </div>
  );
};
