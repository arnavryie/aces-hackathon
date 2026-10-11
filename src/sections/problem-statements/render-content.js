// Build semantic content from the final briefs without interpreting text as HTML.
export function renderProblemSections(container, sections) {
  const content = document.createDocumentFragment();
  for (const section of sections) {
    if (section.type === "heading" || section.type === "paragraph") {
      const element = document.createElement(section.type === "heading" ? "h4" : "p");
      element.textContent = section.text;
      content.append(element);
    } else if (section.type === "list") {
      const list = document.createElement("ul");
      for (const text of section.items) {
        const item = document.createElement("li");
        item.textContent = text;
        list.append(item);
      }
      content.append(list);
    } else if (section.type === "table") {
      const table = document.createElement("table");
      table.className = "problem-criteria";
      const head = table.createTHead().insertRow();
      for (const text of section.headers) {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = text;
        head.append(cell);
      }
      const body = table.createTBody();
      for (const values of section.rows) {
        const row = body.insertRow();
        values.forEach((text, index) => {
          const cell = document.createElement(index === 0 ? "th" : "td");
          if (index === 0) cell.scope = "row";
          cell.textContent = text;
          row.append(cell);
        });
      }
      content.append(table);
    }
  }
  container.replaceChildren(content);
}
